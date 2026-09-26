$ErrorActionPreference = 'Stop'

$portfolioBody = @'
{"name":"Test Portfolio","type":"RUPEE","currency":"INR","benchmark":"NIFTY50","exchange":"NSE","rebalanceFrequency":"MONTHLY","amount":100000}
'@

$portfolio = Invoke-RestMethod -Uri 'http://localhost:8080/api/portfolios' -Method Post -ContentType 'application/json' -Body $portfolioBody
Write-Output ("CREATE:" + $portfolio.id + '|' + $portfolio.type + '|' + $portfolio.name)

$themeBody = @'
{"theme":"AGGRESSIVE"}
'@

$theme = Invoke-RestMethod -Uri ("http://localhost:8080/api/portfolios/" + $portfolio.id + "/theme") -Method Put -ContentType 'application/json' -Body $themeBody
Write-Output ("THEME:" + $theme.theme)

$fetched = Invoke-RestMethod -Uri ("http://localhost:8080/api/portfolios/" + $portfolio.id) -Method Get
Write-Output ("FETCH:" + $fetched.name + '|' + $fetched.theme + '|' + $fetched.type)
