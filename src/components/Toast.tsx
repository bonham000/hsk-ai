import * as RadixToast from "@radix-ui/react-toast";
import * as React from "react";

type ToastProps = {
  description?: string;
  onPress: () => void;
  text: string;
  title: string;
  toastButtonText?: string;
};

export default function Toast(props: ToastProps) {
  const [open, setOpen] = React.useState(false);
  const timerRef = React.useRef(0);

  React.useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <RadixToast.Provider swipeDirection="right">
      <button
        className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-normal p-2 md:py-4 px-8 text-md md:text-lg rounded-full"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          props.onPress();
          setOpen(false);
          window.clearTimeout(timerRef.current);
          timerRef.current = window.setTimeout(() => {
            setOpen(true);
            timerRef.current = window.setTimeout(() => {
              setOpen(false);
            }, 3_000);
          }, 100);
        }}
      >
        {props.text}
      </button>
      <RadixToast.Root
        className="bg-slate-700 text-slate-200 rounded-md shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] p-[15px] grid [grid-template-areas:_'title_action'_'description_action'] grid-cols-[auto_max-content] gap-x-[15px] items-center data-[state=open]:animate-slideIn data-[state=closed]:animate-hide data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-[transform_200ms_ease-out] data-[swipe=end]:animate-swipeOut"
        onOpenChange={setOpen}
        open={open}
      >
        <RadixToast.Title className="[grid-area:_title] font-medium text-slate-200 text-[15px]">
          {props.title}
        </RadixToast.Title>
        <RadixToast.Description className="[grid-area:_description] font-light text-slate-200 text-[15px]">
          {props.description}
        </RadixToast.Description>
        <RadixToast.Action altText="Ok" asChild className="[grid-area:_action]">
          <button className="inline-flex items-center justify-center rounded font-medium text-xs px-[10px] leading-[25px] h-[25px] bg-green2 hover:bg-rose-400">
            {props.toastButtonText ?? "Ok"}
          </button>
        </RadixToast.Action>
      </RadixToast.Root>
      <RadixToast.Viewport className="[--viewport-padding:_25px] fixed top-0 right-0 flex flex-col p-[var(--viewport-padding)] gap-[10px] w-[420px] max-w-[100vw] m-0 list-none z-[2147483647] outline-none" />
    </RadixToast.Provider>
  );
}
