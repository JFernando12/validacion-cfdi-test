import { Page, Browser, launch, LaunchOptions } from "puppeteer";
import PuppeteerConst from './consts'
import path from "path";
import fetch from "node-fetch";
import Captcha from "./captchas/Captchas";
const info = {
  data: [
    {
      cfdi: "9bfbac1d-c5a8-4601-92d0-fbc7279ff2df",
      emisor: "ROL190620IF5",
      receptor: "NME610911L71",
    },
    {
      cfdi: "9bfbac1d-c5a8-4601-92d0-fbc7279ff2df",
      emisor: "ROL190620IF5",
      receptor: "NME610911L71",
    }
  ],
};

const start = async () => {
  const puppeteerConfig: LaunchOptions = await PuppeteerConst(true);

  const browser: Browser = await launch(puppeteerConfig);
  const page: Page = await browser.newPage();

  await page.goto("https://verificacfdi.facturaelectronica.sat.gob.mx/");

  for (const item of info.data) {
    try {
      await page.type("#ctl00_MainContent_TxtUUID", item.cfdi);
      await page.type("#ctl00_MainContent_TxtRfcEmisor", item.emisor);
      await page.type("#ctl00_MainContent_TxtRfcReceptor", item.receptor);
      const urlImageCaptcha = await page.$eval(
        "#ctl00_MainContent_ImgCaptcha",
        (x: any) => x.src
      );
      const fetchCaptcha = await fetch(urlImageCaptcha);
      const bufferCaptcha = await fetchCaptcha.buffer();
      console.log(bufferCaptcha);
      const captchaResolver = new Captcha("cpa/facreview/validate/cfdi");
      for (let i=0; i < 5; i ++) {
        const captchaResponse = await captchaResolver.getTextImageCaptcha( { imagen: `${bufferCaptcha.toString('base64')}` } );
        await page.type("#ctl00_MainContent_TxtCaptchaNumbers", captchaResponse.captchaTexto);
        await page.waitForTimeout(2000);
        await page.click("#ctl00_MainContent_BtnBusqueda");
        await page.waitForTimeout(2000);
        console.log("ciclo: ", i);
        //Comprobando si es correcto el captcha
        const imprimirButton = await page.$("#BtnImprimir");
        if(i === 4 && !imprimirButton) {
          throw "Los datos son incorrecto"
        }
        if(imprimirButton) {
          i = 5
        }
      };
      // @ts-ignore
      await page._client.send("Page.setDownloadBehavior", {
        behavior: "allow",
        downloadPath: `${path.resolve(__dirname, "temp")}`,
      });
      await page.waitForTimeout(6000);
      await page.pdf({path: item.cfdi + '.pdf', format: 'A4', printBackground: true});
    } catch (error) {
      console.log(error);
    }
  }

  await browser.close();
};

start();
