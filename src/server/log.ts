import moment from 'moment';

export default function log(message: string, data?: any) {
    const time = moment(Date.now()).format('HH:mm:ss');
    console.log(`[${time}] | ${message}`, data);
}
