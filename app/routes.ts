//It is a react router configuration file, by default it has only one home page react routing path
import { type RouteConfig, index,route } from "@react-router/dev/routes";


export default [
    index("routes/home.tsx"),
    route("/auth","routes/auth.tsx"),
] satisfies RouteConfig;
