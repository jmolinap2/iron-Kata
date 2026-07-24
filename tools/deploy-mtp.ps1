param(
    [Parameter(Mandatory = $true)]
    [string]$SourceApk,
    [string]$DeviceName = 'POCO X6 Pro 5G',
    [string]$StorageName = 'Almacenamiento interno compartido',
    [string]$DestinationName = "APK'S - DESARROLLOS"
)

$ErrorActionPreference = 'Stop'

if ([Threading.Thread]::CurrentThread.GetApartmentState() -ne 'STA') {
    throw 'Este script debe ejecutarse con Windows PowerShell y el indicador -Sta.'
}

$source = Get-Item -LiteralPath $SourceApk
$expectedName = $source.Name
$expectedShellName = [IO.Path]::GetFileNameWithoutExtension($source.Name)
$expectedSize = [long]$source.Length
$expectedSizeMb = $expectedSize / 1MB
$shell = New-Object -ComObject Shell.Application
$thisPc = $shell.Namespace(0x11)

if ($null -eq $thisPc) {
    throw 'Windows Shell no pudo abrir Este equipo.'
}

function Find-FolderItem {
    param(
        [Parameter(Mandatory = $true)]$Folder,
        [Parameter(Mandatory = $true)][scriptblock]$Predicate
    )

    foreach ($item in $Folder.Items()) {
        if ($item.IsFolder -and (& $Predicate $item)) {
            return $item
        }
    }

    return $null
}

$deviceItem = Find-FolderItem -Folder $thisPc -Predicate {
    param($item)
    $item.Name -eq $DeviceName -or $item.Name -like 'POCO X6 Pro*'
}

if ($null -eq $deviceItem) {
    Write-Output 'MTP_DEVICE_NOT_FOUND'
    exit 2
}

$deviceFolder = $deviceItem.GetFolder()
$storageItem = Find-FolderItem -Folder $deviceFolder -Predicate {
    param($item)
    $item.Name -eq $StorageName -or $item.Name -like '*interno compartido*'
}

if ($null -eq $storageItem) {
    Write-Output 'MTP_STORAGE_NOT_FOUND'
    exit 3
}

$storageFolder = $storageItem.GetFolder()
$destinationItem = Find-FolderItem -Folder $storageFolder -Predicate {
    param($item)
    $item.Name -eq $DestinationName
}

if ($null -eq $destinationItem) {
    Write-Output 'MTP_DESTINATION_NOT_FOUND'
    exit 4
}

$destinationFolder = $destinationItem.GetFolder()
Write-Output ("MTP_DESTINATION_FOUND={0}\{1}\{2}" -f $deviceItem.Name, $storageItem.Name, $destinationItem.Name)

$obsoleteNames = @()
foreach ($item in $destinationFolder.Items()) {
    $itemType = $destinationFolder.GetDetailsOf($item, 1)
    if (-not $item.IsFolder -and $item.Name -like 'Iron-Kata*' -and $itemType -like '*APK*') {
        $obsoleteNames += $item.Name
        $item.InvokeVerb('delete')
    }
}

$deleteDeadline = [DateTime]::UtcNow.AddSeconds(45)
do {
    $remaining = @()
    foreach ($item in $destinationFolder.Items()) {
        $itemType = $destinationFolder.GetDetailsOf($item, 1)
        if (-not $item.IsFolder -and $item.Name -like 'Iron-Kata*' -and $itemType -like '*APK*') {
            $remaining += $item.Name
        }
    }

    if ($remaining.Count -eq 0) {
        break
    }

    Start-Sleep -Milliseconds 750
} while ([DateTime]::UtcNow -lt $deleteDeadline)

if ($remaining.Count -gt 0) {
    throw ('Windows no eliminó las APK anteriores: ' + ($remaining -join ', '))
}

if ($obsoleteNames.Count -gt 0) {
    Write-Output ('MTP_DELETED=' + ($obsoleteNames -join ','))
} else {
    Write-Output 'MTP_DELETED=none'
}

$destinationFolder.CopyHere($source.FullName, 20)
$copyDeadline = [DateTime]::UtcNow.AddMinutes(4)
$copiedItem = $null

do {
    foreach ($item in $destinationFolder.Items()) {
        $itemType = $destinationFolder.GetDetailsOf($item, 1)
        if (-not $item.IsFolder -and $item.Name -in $expectedName, $expectedShellName -and $itemType -like '*APK*') {
            $copiedItem = $item
            break
        }
    }

    if ($null -ne $copiedItem) {
        $reportedSize = [long]$copiedItem.Size
        $sizeDetail = $destinationFolder.GetDetailsOf($copiedItem, 2)
        $sizeNumber = [regex]::Match($sizeDetail, '[\d\.,]+').Value -replace ',', '.'
        $reportedSizeMb = if ($sizeNumber) {
            [double]::Parse($sizeNumber, [Globalization.CultureInfo]::InvariantCulture)
        } else {
            -1
        }

        if ($reportedSize -eq $expectedSize -or [math]::Abs($reportedSizeMb - $expectedSizeMb) -lt 1) {
            break
        }
    }

    $copiedItem = $null
    Start-Sleep -Seconds 1
} while ([DateTime]::UtcNow -lt $copyDeadline)

if ($null -eq $copiedItem) {
    throw "La copia MTP no pudo verificarse para $expectedName ($expectedSize bytes)."
}

$verifiedSize = $destinationFolder.GetDetailsOf($copiedItem, 2)
Write-Output ("MTP_COPIED={0};TYPE={1};SIZE={2}" -f $copiedItem.Name, $destinationFolder.GetDetailsOf($copiedItem, 1), $verifiedSize)
