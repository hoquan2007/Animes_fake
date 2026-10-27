"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
export default function Modal({title,onClose,children,drawer=false}:{title:string;onClose:()=>void;children:ReactNode;drawer?:boolean}) {
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const el=ref.current;el?.showModal();const before=document.body.style.overflow;document.body.style.overflow='clip';return()=>{el?.close();document.body.style.overflow=before;};},[]);
  return <dialog ref={ref} className={drawer?'modal drawer':'modal'} aria-labelledby="modal-title" onCancel={onClose} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div className="modal-head"><h2 id="modal-title">{title}</h2><button className="icon-button" onClick={onClose} aria-label="Đóng"><X size={23}/></button></div>{children}
  </dialog>;
}
