import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";
import * as Select from "@radix-ui/react-select";
import classnames from "classnames";
import React, { type ReactNode } from "react";
import type HskLevel from "~/types/HskLevel";

type SelectItemProps = {
  children: ReactNode;
  className?: string;
  value: string;
};

const SelectItem = React.forwardRef<object, SelectItemProps>(({ children, className, ...props }, forwardedRef) => {
  return (
    <Select.Item
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      className={classnames(
        "text-[13px] leading-none text-violet11 rounded-[3px] flex items-center h-[25px] pr-[35px] pl-[25px] relative select-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:outline-none data-[highlighted]:bg-rose-400 data-[highlighted]:text-violet1",
        className
      )}
      {...props}
      // @ts-ignore
      ref={forwardedRef}
    >
      <Select.ItemText>{children}</Select.ItemText>
      <Select.ItemIndicator className="absolute left-0 w-[25px] inline-flex items-center justify-center">
        <CheckIcon />
      </Select.ItemIndicator>
    </Select.Item>
  );
});
SelectItem.displayName = "Select HSK Level";

type SelectHskLevelProps = {
  onValueChanged: (value: HskLevel) => void;
  value: HskLevel;
};

const SelectHskLevel = (props: SelectHskLevelProps) => (
  <Select.Root onValueChange={(val) => props.onValueChanged(Number(val) as HskLevel)} value={String(props.value)}>
    <Select.Trigger
      aria-label="HSK Level"
      className="inline-flex items-center justify-center rounded px-[15px] text-[13px] leading-none h-[35px] gap-[5px] bg-slate-950 text-violet11 shadow-[0_2px_10px] shadow-black/10 hover:bg-rose-400 focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-violet9 outline-none"
    >
      <Select.Value placeholder="Select an HSK Level" />
      <Select.Icon className="text-violet11">
        <ChevronDownIcon />
      </Select.Icon>
    </Select.Trigger>
    <Select.Portal>
      <Select.Content
        className="overflow-hidden bg-slate-950 rounded-md shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)]"
        onCloseAutoFocus={(e) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          e.preventDefault();
        }}
      >
        <Select.ScrollUpButton className="flex items-center justify-center h-[25px] bg-slate-950 text-violet11 cursor-default">
          <ChevronUpIcon />
        </Select.ScrollUpButton>
        <Select.Viewport className="p-[5px]">
          <Select.Group>
            <Select.Label className="px-[25px] text-xs leading-[25px] text-mauve11">HSL Level</Select.Label>
            <SelectItem value="1">1</SelectItem>
            <SelectItem value="2">2</SelectItem>
            <SelectItem value="3">3</SelectItem>
            <SelectItem value="4">4</SelectItem>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="6">6</SelectItem>
          </Select.Group>
        </Select.Viewport>
        <Select.ScrollDownButton className="flex items-center justify-center h-[25px] bg-slate-950 text-violet11 cursor-default">
          <ChevronDownIcon />
        </Select.ScrollDownButton>
      </Select.Content>
    </Select.Portal>
  </Select.Root>
);

export default SelectHskLevel;
