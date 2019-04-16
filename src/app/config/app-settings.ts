export const auth0Config = Object.freeze({
  // needed for auth0cordova
  clientId: 'QwiLrQiAzTelVZ2iMQ7rnOD0yDcz9YIY',
  // needed for auth0
  clientID: 'QwiLrQiAzTelVZ2iMQ7rnOD0yDcz9YIY',
  domain: 'geeks.auth0.com',
  packageIdentifier: 'com.geeks.business',
  baseUrl: 'https://geeks.auth0.com',
  callbackURL: 'http://localhost:8080/callback',
});

export const sideMenuItems: Array<{ id: number, title: String, pageName: String, src: string, srcActive: string }> = [
  {
    id: 0,
    title: 'Home',
    pageName: 'HomePage',
    src: 'assets/svg/home-icon-gray.svg',
    srcActive: 'assets/svg/home-icon-orange.svg'
  },
  {
    id: 1,
    title: 'Schedule',
    pageName: 'CalendarPage',
    src: 'assets/svg/schedule-icon-gray.svg',
    srcActive: 'assets/svg/schedule-icon-orange.svg'
  },
  {
    id: 2,
    title: 'Activity Tracker',
    pageName: 'ActivityTrackerPage',
    src: 'assets/svg/at-icon-gray.svg',
    srcActive: 'assets/svg/at-icon-orange.svg'
  },
  {
    id: 3,
    title: 'IT Assets',
    pageName: 'ItAssetsPage',
    src: 'assets/svg/pc-icon-menu-gray.svg',
    srcActive: 'assets/svg/pc-icon-menu-orange.svg'
  },
  {
    id: 4,
    title: 'Employees',
    pageName: 'EmployeesPage',
    src: 'assets/svg/employees-icon-gray.svg',
    srcActive: 'assets/svg/employees-icon-orange.svg'
  },
  {
    id: 5,
    title: 'Business Intelligence',
    pageName: 'BusinessIntelligencePage',
    src: 'assets/svg/bi-icon-gray.svg',
    srcActive: 'assets/svg/bi-icon-orange.svg'
  },
];

export const role_menuItem_map = [
  {
    roldID: 0,
    roleName: 'Business Admin',
    allowdMenuItems: [0, 1, 2, 3, 4, 5]
  },
  {
    roldID: 1,
    roleName: 'Client',
    allowdMenuItems: [0, 1, 2, 3]
  },
  {
    roldID: 2,
    roleName: 'Consumer',
    allowdMenuItems: [0, 1, 2]
  },
];

export const excludedInterceptorUrlRegexes = [
  /oauth\/ro/,
  /userinfo/,
  /client\/facebookloginclient/,
];

export const assetNameIconMap = {
  'Laptop': 'laptop.png',
  'Workstations': 'workstation.png',
  'Switch/Router': 'switch.png',
  'Mobile': 'phone.png',
  'Printer': 'printer.png',
  'Servers': 'server.png',
  'Storage': 'storage.png',
  'Scanner/Camera': 'camera.png',
};
