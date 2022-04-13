# Azure

Resources I used for azure:

https://docs.microsoft.com/en-us/azure/container-instances/container-instances-using-azure-container-registry
https://docs.microsoft.com/en-us/azure/container-instances/container-instances-vnet
https://docs.microsoft.com/en-us/azure/container-instances/container-instances-application-gateway
https://docs.microsoft.com/en-us/azure/app-service/overview-vnet-integration
https://docs.microsoft.com/en-us/azure/app-service/deploy-run-package
https://docs.microsoft.com/en-us/cli/azure/webapp?view=azure-cli-latest#az-webapp-create
https://github.com/marketplace/actions/azure-login#configure-a-service-principal-with-a-secret

## Networking

```
acc-rock-solid-vnet
00000000 00000000 00000000 00000000
00000000 00000000 11111111 11111111
10.0.0.0/16

Subnet DB
00000000 00000000 00000000 00000000
00000000 00000000 00000000 00000111
10.0.0.0/29

Subnet Web
00000000 00000000 00000000 00000000
00000000 00000000 00000001 00000000
10.0.1.0/24
```

## Key vault

```sh
RES_GROUP=acc-rock-solid # Resource Group name
ACR_NAME=rocksolidacc       # Azure Container Registry registry name
AKV_NAME=rock-solid       # Azure Key Vault vault name

az keyvault create -g $RES_GROUP -n $AKV_NAME
az keyvault create -g acc-rock-solid -n rock-solid
```

## Create service principal

```sh
az ad sp create-for-rbac \
  --name http://$ACR_NAME-pull \
  --scopes $(az acr show --name $ACR_NAME --query id --output tsv) \
  --role acrpull

SP_ID="abcd5.sdsdsd"
SP_PW="abcd5.sdsdsd"

az keyvault secret set \
  --vault-name $AKV_NAME \
  --name $ACR_NAME-pull-pwd \
  --value $SP_PW

az keyvault secret set \
    --vault-name $AKV_NAME \
    --name $ACR_NAME-pull-usr \
    --value $(az ad sp show --id $SP_ID --query appId --output tsv)
```

## Add more keys

```sh
DATABASE_URL="postgres://rocksolidadmin:{pw}@acc-rock-solid-db.postgres.database.azure.com/postgres?schema=public&sslmode=require"
JWT_SECRET="super-serious"
OFFICE_365_TENANT_ID="12345678-abcd-9012-3456-efghijklmnop"
OFFICE_365_CLIENT_ID="12345678-abcd-9012-3456-efghijklmnop"
OFFICE_365_CLIENT_SECRET="super-secret"

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

## Private network

```sh
VNET=acc-rock-solid-vnet
VNET_ADDRESS_PREFIX="10.0.0.0/16"
SUBNET=web
SUBNET_ADDRESS_PREFIX="10.0.1.0/24"
```

## Deploy container with azure cli

```sh
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --resource-group $RES_GROUP --query "loginServer" --output tsv)
CONTAINER_APP_NAME=acc-rock-solid-web

az container create \
    --name $CONTAINER_APP_NAME \
    --resource-group $RES_GROUP \
    --vnet $VNET \
    --vnet-address-prefix $VNET_ADDRESS_PREFIX \
    --subnet $SUBNET \
    --subnet-address-prefix $SUBNET_ADDRESS_PREFIX\
    --image $ACR_LOGIN_SERVER/rocksolid:latest \
    --registry-login-server $ACR_LOGIN_SERVER \
    --registry-username $(az keyvault secret show --vault-name $AKV_NAME -n $ACR_NAME-pull-usr --query value -o tsv) \
    --registry-password $(az keyvault secret show --vault-name $AKV_NAME -n $ACR_NAME-pull-pwd --query value -o tsv) \
    --ports 3000 \
    --query ipAddress.fqdn \
    --environment-variables 'BASE_URL'="https://$CONTAINER_APP_NAME.westeurope.azurecontainer.io/" 'DATABASE_URL'=$(az keyvault secret show --vault-name $AKV_NAME -n rock-solid-db-url --query value -o tsv) 'JWT_SECRET'=$(az keyvault secret show --vault-name $AKV_NAME -n rock-solid-jwt-secret --query value -o tsv) 'OFFICE_365_TENANT_ID'=$(az keyvault secret show --vault-name $AKV_NAME -n rock-solid-office-365-tenant-id --query value -o tsv) 'OFFICE_365_CLIENT_ID'=$(az keyvault secret show --vault-name $AKV_NAME -n rock-solid-office-365-client-id --query value -o tsv) 'OFFICE_365_CLIENT_SECRET'=$(az keyvault secret show --vault-name $AKV_NAME -n rock-solid-office-365-client-secret --query value -o tsv)

az container attach --resource-group $RES_GROUP --name $CONTAINER_APP_NAME
az container logs --resource-group $RES_GROUP --name $CONTAINER_APP_NAME

az container delete --resource-group $RES_GROUP --name CONTAINER_APP_NAME
```

## Create a public ip adres

```sh
az network vnet subnet create \
  --name gateway \
  --resource-group $RES_GROUP \
  --vnet-name $VNET  \
  --address-prefix 10.0.2.0/24


az container show \
  --name $CONTAINER_APP_NAME \
  --resource-group $RES_GROUP \
  --query ipAddress.ip --output tsv

az network public-ip create \
  --resource-group $RES_GROUP \
  --name $CONTAINER_APP_NAME-public-ip \
  --allocation-method Static \
  --sku Standard

ACI_IP=$(az container show \
  --name $CONTAINER_APP_NAME \
  --resource-group $RES_GROUP \
  --query ipAddress.ip --output tsv)

az network application-gateway create \
  --name ${CONTAINER_APP_NAME}-application-gateway \
  --location westeurope \
  --resource-group $RES_GROUP \
  --capacity 2 \
  --sku Standard_v2 \
  --http-settings-protocol http \
  --public-ip-address $CONTAINER_APP_NAME-public-ip \
  --vnet-name $VNET \
  --subnet gateway \
  --servers "$ACI_IP"

az network public-ip show \
--resource-group $RES_GROUP \
--name $CONTAINER_APP_NAME-public-ip \
--query [ipAddress] \
--output tsv
```

## Create application gateway

```
az network application-gateway create \
  --name acc-rock-solid-gateway \
  --location "West Europe" \
  --resource-group $RES_GROUP \
  --capacity 2 \
  --sku Standard_v2 \
  --http-settings-protocol http \
  --public-ip-address myAGPublicIPAddress \
  --vnet-name myVNet \
  --subnet myAGSubnet \
  --servers "$ACI_IP"
```

## Run your app in Azure App Service directly from a ZIP package

```sh
zip -r deploy.zip .deploy/
```

## Env

```sh
RES_GROUP=acc-rock-solid # Resource Group name
AKV_NAME=rock-solid       # Azure Key Vault vault name
APP_NAME=acc-rock-solid-web
APP_SERVICE_PLAN=acc-rock-solid-web
VNET=acc-rock-solid-vnet
SUBNET=web

```

### Create

```sh
az appservice plan create --name $APP_SERVICE_PLAN --resource-group $RES_GROUP --sku B1
az webapp create -g $RES_GROUP -p $APP_SERVICE_PLAN -n $APP_NAME --runtime "node|14-lts" --vnet $VNET --subnet $SUBNET

az webapp config appsettings set --resource-group $RES_GROUP --name $APP_NAME --settings 'BASE_URL'="https://$APP_NAME.azurewebsites.net" 'DATABASE_URL'=$(az keyvault secret show --vault-name $AKV_NAME -n rock-solid-db-url --query value -o tsv) 'JWT_SECRET'=$(az keyvault secret show --vault-name $AKV_NAME -n rock-solid-jwt-secret --query value -o tsv) 'OFFICE_365_TENANT_ID'=$(az keyvault secret show --vault-name $AKV_NAME -n rock-solid-office-365-tenant-id --query value -o tsv) 'OFFICE_365_CLIENT_ID'=$(az keyvault secret show --vault-name $AKV_NAME -n rock-solid-office-365-client-id --query value -o tsv) 'OFFICE_365_CLIENT_SECRET'=$(az keyvault secret show --vault-name $AKV_NAME -n rock-solid-office-365-client-secret --query value -o tsv)


az webapp connection create postgres-flexible --client-type nodejs --resource-group $RES_GROUP -n $APP_NAME --target-resource-group $RES_GROUP --server acc-rock-solid-db.postgres.database.azure.com --database rock-solid-db  --secret name=XX secret=XX
```

### Enable running from package

```sh
az webapp config appsettings set --resource-group $RES_GROUP --name $APP_NAME --settings WEBSITE_RUN_FROM_PACKAGE="1"
```

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
AZURE_STORAGE_KEY=super-secret

az storage share create --name import --account-name $AZURE_STORAGE_ACCOUNT --account-key $AZURE_STORAGE_KEY
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

