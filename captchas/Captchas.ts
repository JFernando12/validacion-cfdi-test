import { DEAD_BY_CAPTCHA_PASSWORD, DEAD_BY_CAPTCHA_USER } from '../EnvironmentVariables';
import fetch from 'node-fetch';
import DeadByCaptcha from './nodeDeadByCaptchaApi/deathbycaptcha';
import DeadByCaptchaAPI_images from './nodeDeadByCaptcha/new_recaptcha_coordinates';

export default class Captcha {
    domain: string;

    constructor(domain: string) {
        console.log('captcha class');
        this.domain = domain || '';
    }


    async getTextImageCaptchaNewService(captchaImage: { imagen: string }): Promise<string> {
        console.log('new cpatcha service');
        const data = JSON.stringify({ imagen_base64: captchaImage.imagen });
        console.log('JSON:', data);
        const response = await fetch(`https://cpainbox.cpavision.mx/imagepro/index.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: data,
        });

        const finalData = await response.json();
        console.log('captchaServiceCount RESPONSE:', finalData);

        console.log('--> Decodificando CAPTCHA...', finalData);
        //OBTENER TEXTO DEL CAPTCHA
        // @ts-ignore
        const captchaTexto = await finalData.texto.toUpperCase();
        console.log('CAPTCHA:', captchaTexto);
        /*this.captchaServiceCount()
            .then(console.log)
            .catch(console.log);*/
        return captchaTexto;
    }

    async getTextImageCaptcha(captchaImage: { imagen: string }): Promise<{ captchaTexto: string; captchaId: string }> {
        //DEATH BY CAPTCHA
        const data = JSON.stringify(captchaImage);
        console.log('JSON:', data);
        const reCaptcha = new DeadByCaptchaAPI_images(DEAD_BY_CAPTCHA_USER, DEAD_BY_CAPTCHA_PASSWORD);
        console.log('--> Decodificando CAPTCHA...');
        const response = await new Promise((resolve: (captcha: any) => void, reject: () => void) => {
            console.log('reCaptcha call: ');
            reCaptcha.decode(captchaImage.imagen, (captcha: () => any) => {
                console.log('reCaptcha resolve: ', captcha);
                if (captcha) {
                    // Report an incorrectly solved CAPTCHA.
                    // Make sure the CAPTCHA was in fact incorrectly solved!
                    //reCaptcha.report(captcha['captcha'], (result) => {
                    //    console.log('Report status: ' + result);
                    //});
                    console.log(captcha);
                    resolve(captcha);
                } else {
                    console.log('reCaptcha no found: ', captcha);
                    reject();
                }
            });
        })
            .then((resPromise: any) => {
                console.log('REQUEST CAPTCHA:', resPromise);
                try {
                    const obj = resPromise; //JSON.parse(resPromise);
                    return obj;
                } catch ($error) {
                    return { texto: 'ERROR', saldo: '' };
                }
            })
            .catch((error: any) => {
                console.log('CAPTCHA ERROR:', error);
                throw 'ERROR SERVICIO CAPTCHA NO DISPONIBLE!!';
            });

        //OBTENER TEXTO DEL CAPTCHA
        const captchaTexto = await response.texto.toUpperCase();
        const captchaId = await response.captcha;
        console.log('CAPTCHA:', captchaTexto, 'CAPTCHA ID:', captchaId);
        /*this.captchaServiceCount()
            .then(console.log)
            .catch(console.log);*/
        return { captchaTexto, captchaId };
    }

    async getImagesReCaptcha(token_params: any): Promise<any> {
        const reCaptcha = new DeadByCaptcha.SocketClient(DEAD_BY_CAPTCHA_USER, DEAD_BY_CAPTCHA_PASSWORD);
        const response = await new Promise((resolve: (captcha: any) => void, reject: () => void) => {
            let finish = 0;

            setTimeout(() => {
                console.log('validando si ya termino esa cosa');
                if (!finish) {
                    reject();
                }
            }, 90000);

            try {
                // @ts-ignore
                reCaptcha.decode({ extra: { type: 4, token_params: token_params } }, (captcha: () => any) => {
                    console.log('reCaptcha resolve: ', captcha);
                    if (captcha) {
                        // Report an incorrectly solved CAPTCHA.
                        // Make sure the CAPTCHA was in fact incorrectly solved!
                        //reCaptcha.report(captcha['captcha'], (result) => {
                        //    console.log('Report status: ' + result);
                        //});
                        finish = 1;
                        resolve(captcha);
                    } else {
                        console.log('reCaptcha no found: ', captcha);
                        finish = 1;
                        reject();
                    }
                });
            } catch (e) {
                finish = 1;
                console.log('reCaptcha reject: ');
                reject();
            }
        });

        console.log('RECPATCHA :', response);
        this.captchaServiceCount()
            .then(console.log)
            .catch(console.log);
        return response;
    }

    async reportImageCaptcha(captchaId: string): Promise<void> {
        //DEATH BY CAPTCHA
        console.log('report captcha images:', captchaId);
        const reCaptcha = new DeadByCaptchaAPI_images(DEAD_BY_CAPTCHA_USER, DEAD_BY_CAPTCHA_PASSWORD);
        console.log('--> send link report captcha images...');
        reCaptcha.report(captchaId);
    }

    async captchaServiceCount(): Promise<void> {
        console.log('captchaServiceCount: ', this.domain);
        try {
            const response = await fetch(
                `http://10.0.2.220/access/index.php?command=logCaptchas&robot=${this.domain}&captchas=1`
            );
            console.log('captchaServiceCount RESPONSE:', await response.json());
        } catch (e) {
            console.log('Ocurrió un error al generar log de captchas');
        }
    }
}
