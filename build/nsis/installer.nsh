!macro customHeader
  # Verifica se já não foi definido pelo electron-builder para evitar conflito
  !ifdef MUI_WELCOMEFINISHPAGE_BITMAP
    !undef MUI_WELCOMEFINISHPAGE_BITMAP
  !endif
  !define MUI_WELCOMEFINISHPAGE_BITMAP "${BUILD_RESOURCES_DIR}/sidebar.bmp"

  !ifdef MUI_UNWELCOMEFINISHPAGE_BITMAP
    !undef MUI_UNWELCOMEFINISHPAGE_BITMAP
  !endif
  !define MUI_UNWELCOMEFINISHPAGE_BITMAP "${BUILD_RESOURCES_DIR}/sidebar.bmp"
!macroend