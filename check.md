Get-ChildItem -Recurse -File | Where-Object {$_.LastWriteTime -gt (Get-Date).AddMinutes(-90)} | Sort-Object LastWriteTime -Descending | select-Object LastWriteTime, FullName
