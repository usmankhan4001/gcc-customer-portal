$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open("D:\GCC Startup\Customer Portal\GCCStartup_Webapp_Execution_Plan.docx")
$doc.SaveAs("D:\GCC Startup\Customer Portal\execution_plan.txt", 10)
$doc.Close()
$word.Quit()
Write-Output "Done"
