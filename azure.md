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
az account login
az account set --subscription $SUBSCRIPTION_ID
```

## Resource group

```
RES_GROUP=acc-rock-solid # Resource Group name
az group create --name $RES_GROUP --location westeurope
az configure --defaults location=westeurope
```

## Networking

Topology:

```
00000000 00000000 00000000 00000000
00000000 00000000 11111111 11111111
10.0.0.0/16

Subnet DB
00000000 00000000 00000000 00000000
00000000 00000000 00000000 00000111
10.0.0.0/29

Subnet Web
00000000 00000000 00000001 00000000
00000000 00000000 00000001 00000111
10.0.1.0/29
```

```shell
VNET=acc-rock-solid-vnet

az network vnet create --name $VNET  \
  --resource-group $RES_GROUP \
  --address-prefix 10.0.0.0/16 

az network vnet subnet create --vnet-name $VNET \
   --resource-group $RES_GROUP \
   --name DB \
   --address-prefixes 10.0.0.0/29

az network vnet subnet create --vnet-name $VNET \
   --resource-group $RES_GROUP \
   --name Web \
   --address-prefixes 10.0.1.0/29  
```

## Key vault

```sh
AKV_NAME=acc-rock-solid-kv      # Azure Key Vault vault name

az keyvault create -g $RES_GROUP -n $AKV_NAME
```

## Database

```
DB_NAME=acc-rock-solid-db
az postgres flexible-server create --database-name $DB_NAME \
    --resource-group $RES_GROUP \
    --vnet $VNET \
    --subnet DB \
    --sku-name Standard_B1ms \
    --tier Burstable
```

> Do you want to create a new private DNS zone server415881925.private.postgres.database.azure.com in resource group acc-rock-solid (y/n): y

```
DATABASE_URL=postgresql://user:password@server123456.postgres.database.azure.com/postgres?sslmode=require
```

## Create App and certificate

Go to AD app registrations and register a new app. Create client secret. I.e. acc-rock-solid. Fill env variables:

```
OFFICE_365_TENANT_ID="12345678-abcd-9012-3456-efghijklmnop"
OFFICE_365_CLIENT_ID="12345678-abcd-9012-3456-efghijklmnop"
OFFICE_365_CLIENT_SECRET="super-secret"
```

## Add those keys

```sh
az keyvault secret set \
  --vault-name $AKV_NAME \
  --name rock-solid-db-url \
  --value $DATABASE_URL
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

## Run your app in Azure App Service directly from a ZIP package

```sh
zip -r deploy.zip .deploy/
```

## Env

```sh
RES_GROUP=acc-rock-solid # Resource Group name
AKV_NAME=acc-rock-solid-kv   # Azure Key Vault vault name
APP_NAME=acc-rock-solid-web
APP_SERVICE_PLAN=acc-rock-solid-web
VNET=acc-rock-solid-vnet
SUBNET=web
```

### Create

```sh
APP_NAME=acc-rock-solid-web-app
APP_SERVICE_PLAN=acc-rock-solid-web-plan

az appservice plan create --is-linux --name $APP_SERVICE_PLAN --resource-group $RES_GROUP --sku B1
az webapp create -g $RES_GROUP -p $APP_SERVICE_PLAN -n $APP_NAME --runtime "NODE:16-lts" --vnet $VNET --subnet web

az webapp config appsettings set --resource-group $RES_GROUP --name $APP_NAME --settings 'BASE_URL'="https://$APP_NAME.azurewebsites.net" 'DATABASE_URL'=$(az keyvault secret show --vault-name $AKV_NAME -n rock-solid-db-url --query value -o tsv) 'JWT_SECRET'=$(az keyvault secret show --vault-name $AKV_NAME -n rock-solid-jwt-secret --query value -o tsv) 'OFFICE_365_TENANT_ID'=$(az keyvault secret show --vault-name $AKV_NAME -n rock-solid-office-365-tenant-id --query value -o tsv) 'OFFICE_365_CLIENT_ID'=$(az keyvault secret show --vault-name $AKV_NAME -n rock-solid-office-365-client-id --query value -o tsv) 'OFFICE_365_CLIENT_SECRET'=$(az keyvault secret show --vault-name $AKV_NAME -n rock-solid-office-365-client-secret --query value -o tsv) WEBSITE_RUN_FROM_PACKAGE="1"


az webapp connection create postgres-flexible --client-type nodejs --resource-group $RES_GROUP -n $APP_NAME --target-resource-group $RES_GROUP --server acc-rock-solid-db.postgres.database.azure.com --database rock-solid-db  --secret name=XX secret=XX
```

## Create service principal

See https://github.com/marketplace/actions/azure-login#configure-deployment-credentials

```sh
SP_NAME=acc-rock-solid
az ad sp create-for-rbac --name $SP_NAME --role contributor \
                         --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RES_GROUP \
                         --sdk-auth
```

Add under `AZURE_CREDENTIALS` in gh secrets

### Deploy the package

```sh
# Preview command
az webapp deploy --resource-group $RES_GROUP --name $APP_NAME --src-path .deploy/deploy.zip

# Stable?? command
az webapp deployment source config-zip --resource-group $RES_GROUP --name $APP_NAME --src .deploy/deploy.zip
```

## Azure login CI/CD

### Configure a service principal with a secret

```sh
RES_GROUP=acc-rock-solid # Resource Group name
APP_NAME=acc-rock-solid-web
SUBSCRIPTION_ID=some_guid

az ad sp create-for-rbac --name $APP_NAME --role contributor \
                          --scopes /subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RES_GROUP} \
                          --sdk-auth
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
