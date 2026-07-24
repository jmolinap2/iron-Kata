param(
    [string]$DeviceName = 'POCO X6 Pro 5G',
    [string]$StorageName = 'Almacenamiento interno compartido',
    [string]$DestinationName = "APK'S - DESARROLLOS"
)

$ErrorActionPreference = 'Stop'
$shell = New-Object -ComObject Shell.Application
$folder = $shell.Namespace(0x11)

foreach ($item in $folder.Items()) {
    if ($item.IsFolder -and ($item.Name -eq $DeviceName -or $item.Name -like 'POCO X6 Pro*')) {
        $folder = $item.GetFolder()
        break
    }
}

foreach ($item in $folder.Items()) {
    if ($item.IsFolder -and ($item.Name -eq $StorageName -or $item.Name -like '*interno compartido*')) {
        $folder = $item.GetFolder()
        break
    }
}

foreach ($item in $folder.Items()) {
    if ($item.IsFolder -and $item.Name -eq $DestinationName) {
        $folder = $item.GetFolder()
        break
    }
}

foreach ($item in $folder.Items()) {
    $details = @()
    for ($column = 0; $column -le 4; $column++) {
        $details += $folder.GetDetailsOf($item, $column)
    }

    Write-Output ("ITEM={0};SIZE_PROPERTY={1};DETAILS={2}" -f $item.Name, $item.Size, ($details -join '|'))
}
