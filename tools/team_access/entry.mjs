import css from "./portal.css";
import { handleRequest } from "./worker.mjs";
export default {
  fetch(request, env) {
    return handleRequest(request, env, css);
  }
};
