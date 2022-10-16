set -e

az storage file download --share-name import --path import.zip --account-name $AZURE_STORAGE_ACCOUNT --account-key $AZURE_STORAGE_KEY
unzip import.zip -d . 
rm import.zip
