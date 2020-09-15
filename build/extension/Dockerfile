FROM beevelop/ionic:v5.2.3

RUN apt-get update -y && apt-get install -y \
    bzip2 \
    build-essential  \
    pkg-config  \
    libjpeg-dev \
    libcairo2-dev 

# create app directory
RUN mkdir /app
WORKDIR /app

# using npm 6.5.0 to fix installing certain cordova/ionic plugins
RUN npm install -g npm@6.5.0 ionic@5.4.0 @capacitor/core@2.4.0 @capacitor/android@2.4.0 @capacitor/cli@2.4.0
RUN npm cache clean -f
RUN npm install -g n
RUN n 10.14.1

RUN npm install @ionic/cli

# Install app dependencies, using wildcard if package-lock exists
COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json

# install dependencies
RUN npm ci

RUN mkdir www

# Bundle app source
COPY . /app

# post-install hook, to be safe if it got cached
RUN node scripts/patch-crypto.js
RUN ls

# set version code
ARG VERSION
ARG CI_PIPELINE_ID
RUN sed -i -e "s/VERSION_NUMBER/$VERSION/g" src/app/services/app-info/app-info.service.ts
RUN sed -i -e "s/VERSION_CODE/$CI_PIPELINE_ID/g" src/app/services/app-info/app-info.service.ts
# RUN sed -i -e "/\"version\"/c\ \"version\" :\"$VERSION\"," src/manifest.json

# browserify coin-lib
RUN npm run postinstall

# build ionic
RUN npm run build:prod
