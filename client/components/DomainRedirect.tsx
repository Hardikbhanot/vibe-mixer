"use client";

import { useEffect } from "react";

export function DomainRedirect() {
    useEffect(() => {
        if (window.location.hostname === 'localhost') {
            window.location.hostname = '127.0.0.1';
        }
    }, []);

    return null;
}
