import NoSSR from "react-no-ssr";
import App from "~/components/App";

export default function IndexRoute() {
  return (
    <NoSSR>
      <App />
    </NoSSR>
  );
}
