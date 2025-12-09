import Link from 'next/link';

export const Footer = () => {
    return (
        <footer className="w-full py-6 mt-auto border-t border-border bg-background-light dark:bg-background-dark text-muted-foreground text-sm">
            <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <span>© {new Date().getFullYear()} VibeMixer</span>
                </div>

                <div className="flex items-center gap-6">
                    <Link href="/privacy" className="hover:text-primary transition-colors">
                        Privacy Policy
                    </Link>
                    <a href="mailto:support@vibemixer.hbhanot.tech" className="hover:text-primary transition-colors">
                        Contact
                    </a>
                </div>
            </div>
        </footer>
    );
};
