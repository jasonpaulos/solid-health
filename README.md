# Solid Health

![solid-health-animation](https://user-images.githubusercontent.com/5856867/82492308-fcd71900-9ab3-11ea-8752-1d24c7c5e70b.gif "A screen capture of a user logging into and browsing the Solid Health app.")

## About

Solid Health is a decentralized mobile application that can record and manage a user's health
and fitness activity. Solid Heath uses the [Solid](https://solidproject.org/) framework to store
all health data in a user's Solid pod. This app is built using [React Native](https://reactnative.dev/)
and currently only supports Android.

The purpose of the Solid Health application is to provide a decentralized way to record and manage
a user’s health and fitness activity. Data is collected using the [Google Fit APIs](https://developers.google.com/fit/android)
and is stored on a user’s Solid pod according to the [HL7 FHIR RDF](https://www.hl7.org/fhir/rdf.html)
specification.

Currently Solid Health is able to observe the following:

* Number of steps walked per day
* Distanced walked per day
* Instantaneous heart rate

## Install

You can download the latest version of Solid Health from the [release page](https://github.com/jasonpaulos/solid-health/releases).
Each release contains an Android APK file that can be installed on devices and emulators.

## Develop

To make changes to this app, first set up a [React Native Android development environment](https://reactnative.dev/docs/environment-setup),
following the `React Native CLI Quickstart` instructions. You will need Node, the Java Development
Kit, and the Android SDK, as described in the installation guide.

You will also need to follow the steps in the section labelled `Enable Google Fitness API for your
application` in the [installation guide for react-native-google-fit](https://github.com/StasDoskalenko/react-native-google-fit/blob/master/docs/INSTALLATION.md#enable-google-fitness-api-for-your-application)
so that the app can read fitness data. Those steps are:
```
1. In order for the library to work correctly, you'll need following SDK setups:
   
   Android Support Repository
   Android Support Library
   Google Play services
   Google Repository
   Google Play APK Expansion Library
   
2. In order for your app to communicate properly with the Google Fitness API,
   you need to provide the SHA1 sum of the certificate used for signing your
   application to Google. This will enable the GoogleFit plugin to communicate
   with the Fit application in each smartphone where the application is installed.
   https://developers.google.com/fit/android/get-api-key
```

Once you have the correct development enivonrment, follow these steps:

1. Run `npm install` inside the root folder of this repo to install all Node module dependencies.
2. Run `npm start` to start the Metro bundler.
3. Plug in an Android device to run the app, or skip this step to run on an emulator.
4. Run `npm run android` to build and start the app.

You should now have an instance of the application running in debug mode. Modifying a file in
the `src` directory should cause the app to reload with the new version of that file.
