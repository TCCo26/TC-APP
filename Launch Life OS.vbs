' Double-click target for a Desktop shortcut: starts the app with no visible
' console window. Works no matter where this repo folder was cloned/extracted,
' since it resolves its own location instead of a hardcoded path.
Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")
shell.CurrentDirectory = fso.GetParentFolderName(WScript.ScriptFullName)
shell.Run "cmd /c npm start", 0, False
