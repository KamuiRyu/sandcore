package main

import (
	"context"
	"log"
	"net"
	"sync"
	"time"

	"firebase.google.com/go/v4"
	"firebase.google.com/go/v4/messaging"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"google.golang.org/api/option"
)

func main() {
	app := pocketbase.New()

	ctx := context.Background()
	credPath := "firebase-auth.json"
	conf := &firebase.Config{ProjectID: "slp-forge-de309"}
	opt := option.WithCredentialsFile(credPath)
	
	fbApp, err := firebase.NewApp(ctx, conf, opt)
	var fcmClient *messaging.Client
	if err == nil {
		fcmClient, _ = fbApp.Messaging(ctx)
	}

	// Gerenciador de Timers para evitar notificações duplicadas ou obsoletas
	var (
		timers      = make(map[string]*time.Timer)
		timersMutex sync.Mutex
	)

	// Função auxiliar para agendar uma notificação
	scheduleNotification := func(app core.App, record *core.Record) {
		if fcmClient == nil { return }
		
		timerSeconds := record.GetInt("timer")
		if timerSeconds <= 0 { return }

		pinId := record.GetString("pin_id")
		ownerId := record.GetString("owner")
		groupId := record.GetString("group_id")
		
		// Chave única para o timer: se for grupo, a chave é pino+grupo, se for privado, pino+dono
		timerKey := pinId + "_" + ownerId
		if groupId != "" {
			timerKey = pinId + "_group_" + groupId
		}

		// Cancelar timer existente para este pino/contexto se houver
		timersMutex.Lock()
		if t, ok := timers[timerKey]; ok {
			t.Stop()
			delete(timers, timerKey)
		}
		timersMutex.Unlock()

		if record.GetBool("notified") { return }

		// Calcular o momento do disparo
		completedAt := record.GetDateTime("completed_at").Time().UTC()
		respawnTime := completedAt.Add(time.Duration(timerSeconds) * time.Second)
		
		recordType := record.GetString("type")
		isMerchant := recordType == "merchant"

		// Momento base da notificação (usando o dono como referência para o delay inicial se for privado)
		// Para grupos, usaremos o delay individual no momento do envio se necessário, 
		// mas para o agendamento do timer do servidor, usaremos a menor antecedência possível ou 0.
		
		now := time.Now().UTC()
		var delay time.Duration

		if isMerchant {
			delay = 1 * time.Millisecond
		} else {
			// Agendamos o timer para o momento exato do respawn. 
			// A lógica de antecedência (leadTime) será aplicada dentro da execução do timer para cada destinatário.
			delay = respawnTime.Sub(now)

			if delay <= 0 {
				if respawnTime.After(now) {
					delay = 1 * time.Millisecond
				} else {
					return
				}
			}
		}

		// Agendar a execução
		timersMutex.Lock()
		timers[timerKey] = time.AfterFunc(delay, func() {
			timersMutex.Lock()
			delete(timers, timerKey)
			timersMutex.Unlock()

			// Recarregar o registro para garantir que ainda é válido e não foi notificado/deletado
			rec, err := app.FindRecordById("map_respawns", record.Id)
			if err != nil || rec.GetBool("notified") {
				return
			}

			type Recipient struct {
				ID    string
				Token string
				Lead  int // antecedência em segundos
			}
			var recipients []Recipient

			currentGroupId := rec.GetString("group_id")
			currentRecordType := rec.GetString("type")

			if currentGroupId != "" {
				// 1. Buscar membros do grupo
				members := []*core.Record{}
				err := app.RecordQuery("map_group_members").
					AndWhere(dbx.HashExp{"group": currentGroupId}).
					All(&members)

				if err == nil {
					for _, m := range members {
						mUserId := m.GetString("user")
						// 2. Verificar configurações de cada membro
						settings, err := app.FindFirstRecordByFilter(
							"map_notification_settings",
							"owner = {:owner}",
							dbx.Params{"owner": mUserId},
						)
						
						if err == nil && settings != nil && settings.GetBool("push_enabled") {
							enabledTypes := make(map[string]bool)
							settings.UnmarshalJSONField("enabled_types", &enabledTypes)
							
							if val, ok := enabledTypes[currentRecordType]; ok && val {
								// Buscar token do usuário
								u, err := app.FindRecordById("users", mUserId)
								if err == nil && u.GetString("push_token") != "" {
									recipients = append(recipients, Recipient{
										ID:    u.Id,
										Token: u.GetString("push_token"),
										Lead:  settings.GetInt("lead_time"),
									})
								}
							}
						}
					}
				}
			} else {
				// Pessoal: apenas o dono
				settings, err := app.FindFirstRecordByFilter(
					"map_notification_settings",
					"owner = {:owner}",
					dbx.Params{"owner": ownerId},
				)
				
				if err == nil && settings != nil && settings.GetBool("push_enabled") {
					enabledTypes := make(map[string]bool)
					settings.UnmarshalJSONField("enabled_types", &enabledTypes)
					
					if val, ok := enabledTypes[currentRecordType]; ok && val {
						user, err := app.FindRecordById("users", ownerId)
						if err == nil && user.GetString("push_token") != "" {
							recipients = append(recipients, Recipient{
								ID:    user.Id,
								Token: user.GetString("push_token"),
								Lead:  settings.GetInt("lead_time"),
							})
						}
					}
				}
			}

			if len(recipients) == 0 {
				return
			}

			resourceName := rec.GetString("name")
			isMerchant := currentRecordType == "merchant"

			// Enviar para todos os destinatários
			successCount := 0
			for _, r := range recipients {
				title := resourceName + " pronto!"
				body := "O recurso " + resourceName + " está disponível no mapa!"
				
				if isMerchant {
					title = resourceName + " saindo!"
					body = "O " + resourceName + " está saindo do mapa!"
				}

				// FCM Send
				_, err := fcmClient.Send(ctx, &messaging.Message{
					Token: r.Token,
					Notification: &messaging.Notification{
						Title: title,
						Body:  body,
					},
					Webpush: &messaging.WebpushConfig{
						Notification: &messaging.WebpushNotification{
							Icon: rec.GetString("icon_url"),
						},
						FCMOptions: &messaging.WebpushFCMOptions{
							Link: "https://slpforge.xyz/map",
						},
					},
				})

				if err != nil {
					// Limpar token inválido
					if u, err := app.FindRecordById("users", r.ID); err == nil {
						u.Set("push_token", "")
						app.Save(u)
					}
				} else {
					successCount++
				}
			}

			if successCount > 0 {
				rec.Set("notified", true)
				app.Save(rec)
			}
		})
		timersMutex.Unlock()
	}

	app.Cron().Add("cleanupBuildViews", "@daily", func() {
		if _, err := app.DB().NewQuery("DELETE FROM build_views WHERE created < datetime('now', '-30 days')").Execute(); err != nil {
			log.Printf("ERRO: Falha na limpeza de build_views: %v", err)
		}
	})

	// Reset global do mapa às 00:00 e 12:00 UTC
	app.Cron().Add("resetMapRespawns00", "0 0 * * *", func() {
		if _, err := app.DB().NewQuery("DELETE FROM map_respawns").Execute(); err != nil {
			log.Printf("ERRO: Falha no reset global de map_respawns (00:00): %v", err)
		}
	})

	app.Cron().Add("resetMapRespawns12", "0 12 * * *", func() {
		if _, err := app.DB().NewQuery("DELETE FROM map_respawns").Execute(); err != nil {
			log.Printf("ERRO: Falha no reset global de map_respawns (12:00): %v", err)
		}
	})

	app.OnServe().BindFunc(func(e *core.ServeEvent) error {
		respawns := []*core.Record{}
		_ = app.RecordQuery("map_respawns").
			AndWhere(dbx.NewExp("notified = false AND timer > 0 AND completed_at != ''")).
			All(&respawns)
		
		for _, r := range respawns {
			scheduleNotification(app, r)
		}

		// Hook: seta defaults de status e role ao criar usuário
		app.OnRecordAfterCreateSuccess("users").BindFunc(func(e *core.RecordEvent) error {
			if e.Record.GetString("status") == "" {
				e.Record.Set("status", "pending")
			}
			if e.Record.GetString("role") == "" {
				e.Record.Set("role", "ninja")
			}
			if err := app.Save(e.Record); err != nil {
				log.Printf("ERRO: Falha ao setar defaults do usuário: %v", err)
			}
			return e.Next()
		})

		// Hook: protege campos sensíveis de users contra edição pelo próprio usuário
		app.OnRecordBeforeUpdateRequest("users").BindFunc(func(e *core.RecordRequestEvent) error {
			authRecord := e.Auth
			if authRecord == nil {
				return e.Next()
			}
			if authRecord.GetString("role") == "admin" {
				return e.Next()
			}
			if authRecord.Id != e.Record.Id {
				return e.Next()
			}
			protectedFields := []string{
				"role", "status", "title_points", "ninja_rank", "level",
				"approved_by", "approved_at", "organization", "current_title",
			}
			for _, field := range protectedFields {
				if e.Record.GetString(field) != e.Record.Original().GetString(field) {
					return e.BadRequestError("Campo não permitido: "+field, nil)
				}
			}
			return e.Next()
		})

		// Hook: ao criar/atualizar organization_members, sincroniza user.organization
		syncUserOrg := func(record *core.Record) error {
			userId := record.GetString("user")
			org := record.GetString("organization")
			user, err := app.FindRecordById("users", userId)
			if err != nil {
				return err
			}
			user.Set("organization", org)
			return app.Save(user)
		}

		app.OnRecordAfterCreateSuccess("organization_members").BindFunc(func(e *core.RecordEvent) error {
			if err := syncUserOrg(e.Record); err != nil {
				log.Printf("ERRO: Falha ao sincronizar organization do user: %v", err)
			}
			return e.Next()
		})

		app.OnRecordAfterUpdateSuccess("organization_members").BindFunc(func(e *core.RecordEvent) error {
			if err := syncUserOrg(e.Record); err != nil {
				log.Printf("ERRO: Falha ao sincronizar organization do user: %v", err)
			}
			return e.Next()
		})

		// Hook: ao remover membro da organização, limpa user.organization
		app.OnRecordAfterDeleteSuccess("organization_members").BindFunc(func(e *core.RecordEvent) error {
			userId := e.Record.GetString("user")
			user, err := app.FindRecordById("users", userId)
			if err != nil {
				log.Printf("ERRO: Falha ao encontrar user para limpar organization: %v", err)
				return e.Next()
			}
			user.Set("organization", "")
			if err := app.Save(user); err != nil {
				log.Printf("ERRO: Falha ao limpar organization do user: %v", err)
			}
			return e.Next()
		})

		app.OnRecordAfterCreateSuccess("map_respawns").BindFunc(func(e *core.RecordEvent) error {
			scheduleNotification(app, e.Record)
			return e.Next()
		})

		app.OnRecordAfterUpdateSuccess("map_respawns").BindFunc(func(e *core.RecordEvent) error {
			scheduleNotification(app, e.Record)
			return e.Next()
		})

		// Rotas Customizadas permanecem iguais
		e.Router.POST("/api/save-token", func(re *core.RequestEvent) error {
			authRecord := re.Auth
			if authRecord == nil { return re.ForbiddenError("Não autorizado", nil) }
			var data struct { Token string `json:"token"` }
			if err := re.BindBody(&data); err != nil { return re.BadRequestError("Dados inválidos", err) }
			if len(data.Token) < 100 || len(data.Token) > 255 { return re.BadRequestError("Token com formato inválido", nil) }
			authRecord.Set("push_token", data.Token)
			if err := re.App.Save(authRecord); err != nil { return re.InternalServerError("Falha ao salvar token", err) }
			return re.JSON(200, map[string]string{"message": "Token salvo com sucesso"})
		})

		e.Router.POST("/api/increment-usage/{id}", func(re *core.RequestEvent) error {
			id := re.Request.PathValue("id")
			record, err := re.App.FindRecordById("public_builds", id)
			if err != nil { return re.NotFoundError("Build não encontrada", nil) }
			userId := ""; if re.Auth != nil { userId = re.Auth.Id }
			ip := re.Request.Header.Get("X-Real-IP")
			if ip == "" { ip = re.Request.Header.Get("X-Forwarded-For") }
			if ip == "" { host, _, err := net.SplitHostPort(re.Request.RemoteAddr); if err == nil { ip = host } else { ip = re.Request.RemoteAddr } }
			today := time.Now().UTC().Format("2006-01-02")
			filter := "build = {:buildId} && created >= {:today} && (user = {:userId} || ip = {:ip})"
			params := dbx.Params{"buildId": id, "today": today, "userId": userId, "ip": ip}
			if userId == "" { filter = "build = {:buildId} && created >= {:today} && ip = {:ip}" }
			exists, _ := re.App.FindFirstRecordByFilter("build_views", filter, params)
			if exists != nil { return re.JSON(200, map[string]int{"usage_count": record.GetInt("usage_count")}) }
			record.Set("usage_count", record.GetInt("usage_count") + 1)
			if err := re.App.Save(record); err != nil { return re.InternalServerError("Falha ao salvar", err) }
			viewCollection, _ := re.App.FindCollectionByNameOrId("build_views")
			viewRecord := core.NewRecord(viewCollection)
			viewRecord.Set("build", id); if userId != "" { viewRecord.Set("user", userId) }; viewRecord.Set("ip", ip)
			if err := re.App.Save(viewRecord); err != nil { log.Printf("ERRO: Falha ao salvar visualização: %v", err) }
			return re.JSON(200, map[string]int{"usage_count": record.GetInt("usage_count")})
		})

		e.Router.POST("/api/remove-token", func(re *core.RequestEvent) error {
			authRecord := re.Auth
			if authRecord == nil { return re.ForbiddenError("Não autorizado", nil) }
			authRecord.Set("push_token", "")
			if err := re.App.Save(authRecord); err != nil { return re.InternalServerError("Falha ao remover token", err) }
			return re.JSON(200, map[string]string{"message": "Token removido com sucesso"})
		})

		return e.Next()
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}