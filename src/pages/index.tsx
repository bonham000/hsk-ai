import App from "next/app";
import NoSSR from "react-no-ssr";

export default function IndexRoute() {
  return (
    <NoSSR>
      <App />
    </NoSSR>
  );
}
