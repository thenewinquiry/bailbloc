# Bail Bloc Desktop Client

## Developer setup

1. clone the repo
2. cd into the `desktop` folder
3. install packages with `npm install`
4. (Optional) globally install platform-specific 7zip-bin package with `npm install -g 7zip-bin`

## Run the app

```
npm start
```

## Make a new public release

### Building the miner binaries

#### MacOS

```
cmake .. -DWITH_AEON=OFF -DWITH_HTTPD=OFF -DWITH_TLS=OFF
```

### Changes to Electron

Increment the version number found in `package.json` to make a new release.

### Create a BailBloc binary

```
npm run buildall
```

or

```
electron-builder --mac #or --windows or --linux
```

This will package up the app and stick it in the `dist` folder.

### Publish to GitHub

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
