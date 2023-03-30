# KOYOH-MotionVisualizer

In this application, you can visualize the orbital and attitude motion of satellites on the virtual earth globe.
Developed with Electron and CesiumJS.

## Get started

### npm & yarn

Node.js is required. If you have not installed Node.js, please install it from the [official page](https://nodejs.org/en).

After cloning the repository, run the following command to install the package.

```shell
cd KOYOH-MotionVisualizer
npm install
```

Build the application after installing the package.

```shell
# For Mac OS (Intel CPU)
npx electron-builder --mac --x64 --dir

# For Mac OS (Arm CPU)
npx electron-builder --arm64 --dir

# For Windows
npx electron-builder --win --x64 --dir
```
