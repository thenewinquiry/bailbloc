# Bail Bloc Desktop Client

## Developer setup

1. clone the repo
2. cd into the `desktop` folder
3. install packages with `npm install`

## Run the app

```
npm start
```

## Create a binary

```
npm run pack
```

or 

```
electron-builder --mac #or --windows or --linux
```

This will package up the app and stick it in the `dist` folder.

## Make a new public releaes

First generate a GitHub access token by going to [https://github.com/settings/tokens/new](https://github.com/settings/tokens/new).

The access token should have the repo scope/permission. Once you have the token, assign it to an environment variable (on macOS/linux):

```
export GH_TOKEN="<YOUR_TOKEN_HERE>"
```

Then run:

```
npm run publish
```

This will create a draft of a github release at [https://github.com/thenewinquiry/bailbloc/releases](https://github.com/thenewinquiry/bailbloc/releases). Edit the draft to make the release public.

Please note: you must increment the version number found in `package.json` to make a new release.
