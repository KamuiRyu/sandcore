package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
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

	// Reset de pontos diários dos usuários às 12:00 BRT (15:00 UTC)
	app.Cron().Add("resetDailyPoints", "0 15 * * *", func() {
		if _, err := app.DB().NewQuery("UPDATE users SET daily_points_used = 0").Execute(); err != nil {
			log.Printf("ERRO: Falha no reset diário de daily_points_used: %v", err)
		}
	})

	formatYens := func(amount float64) string {
		n := int64(amount)
		s := fmt.Sprintf("%d", n)
		result := ""
		for i, c := range s {
			if i > 0 && (len(s)-i)%3 == 0 {
				result += "."
			}
			result += string(c)
		}
		return result + " Yens"
	}

	sendDiscordWebhook := func(context string, message string) {
		webhookURL := os.Getenv("DISCORD_WEBHOOK_URL")
		if webhookURL == "" {
			log.Printf("[Discord/%s] DISCORD_WEBHOOK_URL não configurada, mensagem ignorada", context)
			return
		}
		log.Printf("[Discord/%s] Enviando mensagem para webhook...", context)
		payload, err := json.Marshal(map[string]string{"content": message})
		if err != nil {
			log.Printf("[Discord/%s] ERRO: Falha ao serializar payload: %v", context, err)
			return
		}
		resp, err := http.Post(webhookURL, "application/json", bytes.NewBuffer(payload))
		if err != nil {
			log.Printf("[Discord/%s] ERRO: Falha na requisição HTTP: %v", context, err)
			return
		}
		defer resp.Body.Close()
		if resp.StatusCode >= 200 && resp.StatusCode < 300 {
			log.Printf("[Discord/%s] Mensagem enviada com sucesso (HTTP %d)", context, resp.StatusCode)
		} else {
			log.Printf("[Discord/%s] ERRO: Webhook retornou HTTP %d", context, resp.StatusCode)
		}
	}

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
			if e.Record.GetInt("title_points") <= 0 {
				e.Record.Set("title_points", 0)
			}
			if e.Record.GetString("current_title") == "" {
				titles := []*core.Record{}
			err := app.RecordQuery("titles").
				AndWhere(dbx.NewExp("min_points <= {:pts}", dbx.Params{"pts": newPoints})).
				OrderBy("min_points DESC").
				Limit(1).
				All(&titles)
				if err != nil {
					log.Printf("ERRO: Falha ao buscar títulos: %v", err)
				}
				var titleName string
				if len(titles) > 0 {
					titleName = titles[0].GetString("name")
				}
				e.Record.Set("current_title", titleName)
			if e.Record.GetInt("level") <= 0 {
				e.Record.Set("level", 1)
			}
			if err := app.Save(e.Record); err != nil {
				log.Printf("ERRO: Falha ao setar defaults do usuário: %v", err)
			}
			return e.Next()
		})

		// Hook: protege campos sensíveis de users contra edição pelo próprio usuário
		app.OnRecordUpdateRequest("users").BindFunc(func(e *core.RecordRequestEvent) error {
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

		// Hook: ao atualizar title_points, recalcula current_title
		app.OnRecordAfterUpdateSuccess("users").BindFunc(func(e *core.RecordEvent) error {
			newPoints := e.Record.GetInt("title_points")
			oldPoints := e.Record.Original().GetInt("title_points")
			if newPoints == oldPoints {
				return e.Next()
			}
			titles := []*core.Record{}
			err := app.RecordQuery("titles").
				AndWhere(dbx.NewExp("min_points <= {:pts}", dbx.Params{"pts": newPoints})).
				OrderBy("min_points DESC").
				Limit(1).
				All(&titles)
			if err != nil {
				log.Printf("ERRO: Falha ao buscar títulos: %v", err)
				return e.Next()
			}
			var titleName string
			if len(titles) > 0 {
				titleName = titles[0].GetString("name")
			}
			if e.Record.GetString("current_title") != titleName {
				e.Record.Set("current_title", titleName)
				if err := app.Save(e.Record); err != nil {
					log.Printf("ERRO: Falha ao atualizar current_title: %v", err)
				}
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

		addToBankBalance := func(app core.App, amount float64, txType string, userId string, description string) float64 {
			settings, err := app.FindFirstRecordByFilter("village_settings", "id != ''", dbx.Params{})
			if err != nil {
				log.Printf("[Banco] ERRO: Não foi possível buscar village_settings: %v", err)
				return -1
			}
			currentBalance := settings.GetFloat("bank_balance")
			newBalance := currentBalance + amount
			settings.Set("bank_balance", newBalance)
			if err := app.Save(settings); err != nil {
				log.Printf("[Banco] ERRO: Falha ao atualizar bank_balance: %v", err)
				return -1
			}
			log.Printf("[Banco] Saldo atualizado: %.2f → %.2f (%s)", currentBalance, newBalance, txType)

			txCollection, err := app.FindCollectionByNameOrId("bank_transactions")
			if err != nil {
				log.Printf("[Banco] ERRO: Coleção bank_transactions não encontrada: %v", err)
				return newBalance
			}
			tx := core.NewRecord(txCollection)
			tx.Set("type", txType)
			tx.Set("amount", amount)
			tx.Set("user", userId)
			tx.Set("description", description)
			if err := app.Save(tx); err != nil {
				log.Printf("[Banco] ERRO: Falha ao criar bank_transaction: %v", err)
			}
			return newBalance
		}

		app.OnRecordAfterCreateSuccess("donation_records").BindFunc(func(e *core.RecordEvent) error {
			userId := e.Record.GetString("user")
			amount := e.Record.GetFloat("amount")
			period := e.Record.GetString("period")
			createdAt := e.Record.GetDateTime("created").Time().In(time.FixedZone("BRT", -3*60*60))
			dateStr := createdAt.Format("02/01/2006")
			log.Printf("[Discord/doação] Nova doação: user=%s, amount=%.2f, period=%s, date=%s", userId, amount, period, dateStr)
			userName := userId
			if u, err := app.FindRecordById("users", userId); err == nil {
				userName = u.GetString("name")
			} else {
				log.Printf("[Discord/doação] AVISO: Não foi possível buscar nome do usuário %s: %v", userId, err)
			}
			newBalance := addToBankBalance(app, amount, "donation_income", userId, fmt.Sprintf("Doação de %s — %s", userName, dateStr))
			balanceStr := formatYens(newBalance)
			if newBalance < 0 {
				balanceStr = "indisponível"
			}
			balanceLine := fmt.Sprintf("Saldo atual: **%s**.", balanceStr)
			if newBalance < 0 {
				balanceLine = "Saldo atual: indisponível."
			}
			msg := fmt.Sprintf(">>> 💰 O ninja **%s** doou **%s** para o banco da vila.\n%s", userName, formatYens(amount), balanceLine)
			sendDiscordWebhook("doação", msg)
			return e.Next()
		})

		app.OnRecordAfterCreateSuccess("tax_records").BindFunc(func(e *core.RecordEvent) error {
			userId := e.Record.GetString("user")
			amount := e.Record.GetFloat("amount")
			period := e.Record.GetString("period")
			log.Printf("[Discord/taxa] Nova taxa: user=%s, amount=%.2f, period=%s", userId, amount, period)
			userName := userId
			if u, err := app.FindRecordById("users", userId); err == nil {
				userName = u.GetString("name")
			} else {
				log.Printf("[Discord/taxa] AVISO: Não foi possível buscar nome do usuário %s: %v", userId, err)
			}
			newBalance := addToBankBalance(app, amount, "tax_income", userId, fmt.Sprintf("Taxa de %s — período %s", userName, period))
			balanceStr := formatYens(newBalance)
			if newBalance < 0 {
				balanceStr = "indisponível"
			}
			balanceLine := fmt.Sprintf("Saldo atual: **%s**.", balanceStr)
			if newBalance < 0 {
				balanceLine = "Saldo atual: indisponível."
			}
			msg := fmt.Sprintf(">>> 🏦 O ninja **%s** pagou **%s** de taxa para o banco da vila.\n%s", userName, formatYens(amount), balanceLine)
			sendDiscordWebhook("taxa", msg)
			return e.Next()
		})

		app.OnRecordAfterUpdateSuccess("mission_assignments").BindFunc(func(e *core.RecordEvent) error {
			if e.Record.GetString("status") != "completed" {
				return e.Next()
			}
			if e.Record.Original().GetString("status") == "completed" {
				return e.Next()
			}

			templateId := e.Record.GetString("template")
			userId := e.Record.GetString("assigned_to")

			template, err := app.FindRecordById("mission_templates", templateId)
			if err != nil {
				log.Printf("[Banco/missão] ERRO: Template %s não encontrado: %v", templateId, err)
				return e.Next()
			}

			rewardYens := template.GetFloat("reward_yens")
			rewardPoints := template.GetInt("reward_points")
			missionName := template.GetString("title")

			// Creditar title_points no usuário (isso também dispara recálculo de current_title)
			if rewardPoints > 0 {
				ninja, err := app.FindRecordById("users", userId)
				if err == nil {
					ninja.Set("title_points", ninja.GetInt("title_points")+rewardPoints)
					if err := app.Save(ninja); err != nil {
						log.Printf("[Missão] ERRO: Falha ao creditar title_points para %s: %v", userId, err)
					}
				}
			}

			if rewardYens <= 0 {
				return e.Next()
			}

			userName := userId
			if u, err := app.FindRecordById("users", userId); err == nil {
				userName = u.GetString("name")
			}

			desc := fmt.Sprintf("Recompensa de missão: %s — ninja %s", missionName, userName)
			addToBankBalance(app, -rewardYens, "reward_payout", userId, desc)
			log.Printf("[Banco/missão] Descontado %.2f Yens pela missão '%s' do ninja %s", rewardYens, missionName, userName)

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