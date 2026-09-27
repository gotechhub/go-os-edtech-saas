import type { ReactNode } from "react";
import { Refresh } from "./icons";

export function DataState({ title, message, action }: { title: string; message: string; action?: ReactNode }) {
  return <section className="data-state" role="status"><span className="state-icon"><Refresh /></span><h2>{title}</h2><p>{message}</p>{action}</section>;
}
