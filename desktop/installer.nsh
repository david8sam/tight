!macro customCheckAppRunning
  ${nsProcess::FindProcess} "${APP_EXECUTABLE_FILENAME}" $R0
  ${nsProcess::Unload}
  ${If} $R0 != 603
    IfSilent +2
      MessageBox MB_OK|MB_ICONEXCLAMATION "Close TIGHT before installing or removing it. Quitting stops hosting, so finish or pause the game first. Setup has not stopped TIGHT."
    SetErrorLevel 2
    Quit
  ${EndIf}
!macroend

!macro preInit
  !ifndef BUILD_UNINSTALLER
    !insertmacro customCheckAppRunning
  !endif
!macroend
