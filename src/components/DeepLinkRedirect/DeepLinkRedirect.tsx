"use client";

import { useEffect } from "react";

/**
 * Componente que detecta si el usuario está navegando desde el navegador
 * interno de Instagram o Facebook en un dispositivo Android, y fuerza
 * la apertura de la aplicación mediante un Android Intent.
 */
export default function DeepLinkRedirect() {
  useEffect(() => {
    // Si no estamos en el navegador, salir
    if (typeof window === "undefined" || typeof navigator === "undefined") return;

    const userAgent = navigator.userAgent || navigator.vendor;
    
    // Detectar navegadores internos de Meta (Instagram, Facebook)
    const isSocialBrowser = /Instagram|FBAV|FBAN/i.test(userAgent);
    
    // Detectar si es Android
    const isAndroid = /android/i.test(userAgent);

    if (isSocialBrowser && isAndroid) {
      // Obtenemos la URL actual sin el protocolo (ej: sercio.com.ar/perfil/juan)
      const currentUrlWithoutProtocol = window.location.href.replace(/^https?:\/\//, '');
      
      // Construimos el Intent URI para Android apuntando al package actual
      const intentUrl = `intent://${currentUrlWithoutProtocol}#Intent;scheme=https;package=com.sercio.sercio;end;`;
      
      // Intentamos redirigir al Intent. Si la app está instalada, el OS intercepta
      // el intent y abre la app. Si no, simplemente se queda en el navegador.
      setTimeout(() => {
        window.location.href = intentUrl;
      }, 250);
    }
  }, []);

  return null; // Este componente no renderiza nada en el DOM
}
