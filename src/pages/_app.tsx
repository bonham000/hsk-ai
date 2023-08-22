import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { type AppType } from "next/app";
import { Noto_Sans_TC } from "next/font/google";
import "~/styles/globals.css";
import { api } from "~/utils/api";

const notoSans = Noto_Sans_TC({
  style: ["normal"],
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <>
      <style global jsx>{`
        html {
          font-family: ${notoSans.style.fontFamily};
        }
      `}</style>
      <SessionProvider session={session}>
        <Component {...pageProps} />
      </SessionProvider>
    </>
  );
};

export default api.withTRPC(MyApp);
