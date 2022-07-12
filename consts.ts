import { EXECUTABLE_PATH } from './EnvironmentVariables';
import { LaunchOptions } from 'puppeteer';

function PUPPETEER_CONFIG(): LaunchOptions {
    return {
        headless: true,
        ignoreHTTPSErrors: true,
        args: [
            //'--start-maximized',
            //'--disable-gpu',
            //'--disable-dev-shm-usage',
            //'--disable-setuid-sandbox',
            //'--no-first-run',
            '--no-sandbox',
            //'--no-zygote',
            //'--single-process',
        ],
    };
}

const getPuppeteerConfig = async (
    headless: boolean,
    options: LaunchOptions | null = null,
    changeExplorer?: boolean
): Promise<LaunchOptions> => {
    const newConfig = options || PUPPETEER_CONFIG();

    const random: number = Math.floor(Math.random() * 2);

    if (EXECUTABLE_PATH) {
        if (changeExplorer) {
            if (!random) {
                newConfig.executablePath = EXECUTABLE_PATH;
            }
        } else {
            newConfig.executablePath = EXECUTABLE_PATH;
        }
    }

    console.log(
        'initial puppeteer mode headless?: ',
        headless,
        ' and options',
        newConfig,
        'and explorer:',
        changeExplorer,
        random
    );
    newConfig.headless = headless;
    return newConfig;
};

export default getPuppeteerConfig;
