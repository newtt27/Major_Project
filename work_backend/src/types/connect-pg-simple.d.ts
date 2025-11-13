declare module "connect-pg-simple" {
  import { Store } from "express-session";

  function ConnectPgSimple(session: any): any;

  export = ConnectPgSimple;
}
