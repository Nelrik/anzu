import xs from 'xstream';

export function intent(dom, http, storage, socketIO, socketIOChat) {

    /**
     * DOM intents including:
     * - Signin & signup buttons.
     * - Logout button.
     * - Angular handled route links.
     * - Open notifications link.
     */
    const modalLink$ = dom.select('.modal-link').events('click')
        .map(event => ({modal: event.target.dataset.modal, data: event.target.dataset}));

    const logoutLink$ = dom.select('#logout').events('click').mapTo(true);
    
    const ngLink$ = dom.select('.ng-link').events('click')
        .map(ev => ev.currentTarget.dataset.href)
        .debug();

    const openNotifications$ = dom.select('#notifications').events('click');

    /**
     * LocalStorage read effects including:
     * - auth token stream.
     */
    const token$ = storage.local.getItem('id_token')
        .filter(token => token !== null && String(token).length > 0)
        .startWith(false);

    /**
     * HTTP read effects including: 
     * - Logged user data.
     * - Incoming notifications response.
     * - Socket.IO user channel messages.
     */
    const user$ = http.select('me')
        .map(response$ => response$.replaceError(err => xs.of(err)))
        .flatten()
        .filter(res => !(res instanceof Error))
        .map(res => res.body);

    const notifications$ = http.select('notifications')
        .map(response$ => response$.replaceError(err => xs.of(err)))
        .flatten()
        .filter(res => !(res instanceof Error))
        .map(res => res.body);

    const userChan$ = user$.map(user => socketIO.get(`user ${user.id} notification`))
        .flatten()
        .debug();

    /**
     * Socket.IO read effects including: 
     * - Connected users count.
     */
    const online$ = socketIOChat.get('chat.count');

    return {
        modalLink$, 
        logoutLink$, 
        token$, 
        user$, 
        notifications$, 
        userChan$, 
        ngLink$, 
        openNotifications$,
        online$
    };
};