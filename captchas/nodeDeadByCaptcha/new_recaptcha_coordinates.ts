import dbc from './deathbycaptcha';

class CAPTCHA {
    private client: any;

    constructor(username: string, password: string) {
        this.client = new dbc.HttpClient(username, password);
    }

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    get_balance() {
        // eslint-disable-next-line @typescript-eslint/typedef
        this.client.get_balance((balance: any) => {
            console.log(balance);
        });
    }

    // eslint-disable-next-line @typescript-eslint/typedef,@typescript-eslint/camelcase,@typescript-eslint/explicit-function-return-type
    decode(captcha_file: any, cb: any) {
        this.client.decode({ captcha: captcha_file }, (captcha: any) => {
            if (captcha) {
                console.log('Captcha ' + captcha['captcha'] + ' solved: ' + captcha['text']);
                // Report an incorrectly solved CAPTCHA.
                // Make sure the CAPTCHA was in fact incorrectly solved!
                // client.report(captcha['captcha'], (result) => {
                //   console.log('Report status: ' + result);
                // });

                captcha.texto = captcha.text;
                cb(captcha);
            } else {
                cb(null);
            }
        });
    }

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    report(captchaId: string) {
        this.client.report(captchaId, (responde: any) => {
            console.log('responde report captcha', responde);
        });
    }
}

export default CAPTCHA;
