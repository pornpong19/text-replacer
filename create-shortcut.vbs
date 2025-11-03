Set oWS = WScript.CreateObject("WScript.Shell")
sLinkFile = oWS.SpecialFolders("Desktop") & "\Text Replacer.lnk"
Set oLink = oWS.CreateShortcut(sLinkFile)
oLink.TargetPath = WScript.ScriptFullName
oLink.TargetPath = Replace(oLink.TargetPath, "create-shortcut.vbs", "start.bat")
oLink.WorkingDirectory = Replace(WScript.ScriptFullName, "\create-shortcut.vbs", "")
oLink.IconLocation = Replace(WScript.ScriptFullName, "create-shortcut.vbs", "assets\icon.ico")
oLink.Description = "Text Replacer - แก้ไขคำในไฟล์ข้อความ"
oLink.Save

WScript.Echo "Shortcut created on Desktop!"
WScript.Echo "สร้าง Shortcut บน Desktop เรียบร้อยแล้ว!"