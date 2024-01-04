# Azure

Resources I used for azure:

https://docs.microsoft.com/en-us/azure/container-instances/container-instances-using-azure-container-registry
https://docs.microsoft.com/en-us/azure/container-instances/container-instances-vnet
https://docs.microsoft.com/en-us/azure/container-instances/container-instances-application-gateway
https://docs.microsoft.com/en-us/azure/app-service/overview-vnet-integration
https://docs.microsoft.com/en-us/azure/app-service/deploy-run-package
https://docs.microsoft.com/en-us/cli/azure/webapp?view=azure-cli-latest#az-webapp-create
https://github.com/marketplace/actions/azure-login#configure-a-service-principal-with-a-secret

## Set subscription

```
SUBSCRIPTION_ID=12345678-abcd-9012-3456-efghijklmnop
az login
az account set --subscription $SUBSCRIPTION_ID
```

## Resource group

```
RES_GROUP=acc-rock-solid # Resource Group name
az group create --name $RES_GROUP --location westeurope
az configure --defaults location=westeurope
```


## Key vault

```sh
AKV_NAME=acc-rock-solid-kv      # Azure Key Vault vault name

az keyvault create -g $RES_GROUP -n $AKV_NAME
```

## Create App and certificate

Go to AD app registrations and register a new app. Create client secret. I.e. acc-rock-solid. Fill env variables:

```
OFFICE_365_TENANT_ID="12345678-abcd-9012-3456-efghijklmnop"
OFFICE_365_CLIENT_ID="12345678-abcd-9012-3456-efghijklmnop"
OFFICE_365_CLIENT_SECRET="super-secret"
```

## Choose JWT_SECRET

JWT_SECRET=super_secret


## Add those keys

```sh
az keyvault secret set \
  --vault-name $AKV_NAME \
  --name rock-solid-jwt-secret \
  --value $JWT_SECRET
az keyvault secret set \
  --vault-name $AKV_NAME \
  --name rock-solid-office-365-tenant-id \
  --value $OFFICE_365_TENANT_ID
az keyvault secret set \
  --vault-name $AKV_NAME \
  --name rock-solid-office-365-client-id \
  --value $OFFICE_365_CLIENT_ID
az keyvault secret set \
  --vault-name $AKV_NAME \
  --name rock-solid-office-365-client-secret \
  --value $OFFICE_365_CLIENT_SECRET
```

## Env

```sh
RES_GROUP=acc-rock-solid # Resource Group name
AKV_NAME=acc-rock-solid-kv   # Azure Key Vault vault name
APP_NAME=acc-rock-solid-web
APP_SERVICE_PLAN=acc-rock-solid-web-plan
DATABASE_URL="file:./acc.db?connection_limit=1"
```

### Create

```sh
az appservice plan create --is-linux --name $APP_SERVICE_PLAN --resource-group $RES_GROUP --sku B1
az webapp create -g $RES_GROUP -p $APP_SERVICE_PLAN -n $APP_NAME --runtime "NODE:20-lts"

az webapp config appsettings set --resource-group $RES_GROUP --name $APP_NAME --settings 'BASE_URL'="https://$APP_NAME.azurewebsites.net" 'DATABASE_URL'="$DATABASE_URL" 'JWT_SECRET'=$(az keyvault secret show --vault-name $AKV_NAME -n rock-solid-jwt-secret --query value -o tsv) 'OFFICE_365_TENANT_ID'=$(az keyvault secret show --vault-name $AKV_NAME -n rock-solid-office-365-tenant-id --query value -o tsv) 'OFFICE_365_CLIENT_ID'=$(az keyvault secret show --vault-name $AKV_NAME -n rock-solid-office-365-client-id --query value -o tsv) 'OFFICE_365_CLIENT_SECRET'=$(az keyvault secret show --vault-name $AKV_NAME -n rock-solid-office-365-client-secret --query value -o tsv)
```

## Deploy the package using Azure login CI/CD

Use the `azure/webapps-deploy` action with the `publish-profile` you download from the azure portal:

```yml
      - id: deploy-to-webapp
        uses: azure/webapps-deploy@v2
        with:
          app-name: '${{ vars.APP_NAME }}'
          slot-name: 'Production'
          package: .
          publish-profile: ${{ secrets.AZURE_APP_SERVICE_PUBLISH_PROFILE }}
```

## Azure file storage

Create a storage account, for example: "accrocksolidimport"

Create the share:

```sh
RES_GROUP=acc-rock-solid
AZURE_STORAGE_ACCOUNT=accrocksolidimport

az storage account create --name $AZURE_STORAGE_ACCOUNT \
   --sku Standard_LRS \
   --resource-group $RES_GROUP
```

After that, get and set env variable for `AZURE_STORAGE_KEY`

```
az storage account keys list --resource-group $RES_GROUP --account-name $AZURE_STORAGE_ACCOUNT

AZURE_STORAGE_KEY=123supersecret
```

```
az storage share create --name import --account-name $AZURE_STORAGE_ACCOUNT --account-key $AZURE_STORAGE_KEY
```

Add those keys

```sh
az keyvault secret set \
  --vault-name $AKV_NAME \
  --name azure-storage-account-import \
  --value $AZURE_STORAGE_ACCOUNT
az keyvault secret set \
  --vault-name $AKV_NAME \
  --name azure-storage-key-import \
  --value $AZURE_STORAGE_KEY
```

Zip and upload import files

```sh
zip -r import.zip import/
az storage file upload --share-name import --source import.zip --account-name $AZURE_STORAGE_ACCOUNT --account-key $AZURE_STORAGE_KEY
```

Download and unzip

```sh
az storage file download --share-name import --path import.zip --account-name $AZURE_STORAGE_ACCOUNT --account-key $AZURE_STORAGE_KEY
unzip import.zip -d .
```
