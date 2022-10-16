set -e

az storage file download --share-name import --path import.zip --account-name $(az keyvault secret show --vault-name $AKV_NAME -n azure-storage-account-import --query value -o tsv) --account-key $(az keyvault secret show --vault-name $AKV_NAME -n azure-storage-key-import --query value -o tsv)
unzip import.zip -d . 
rm import.zip
