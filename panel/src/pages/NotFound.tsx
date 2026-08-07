import InlineCode from "@/components/InlineCode";
import { useSetPageTitle } from "@/hooks/pages";
import { useEffect } from "react";
import { Link, useLocation } from "wouter";

type Props = {
    params: {
        '*': string;
    };
};
export default function NotFound({ params }: Props) {
    const setPageTitle = useSetPageTitle();
    const setLocation = useLocation()[1];
    setPageTitle('页面未找到');

    // FIXME:NEXT:UPDATE - remove
    useEffect(() => {
        if (params['*'] === 'whitelist') {
            setLocation('/allowlist');
        }
    }, []);

    return (
        <div className="w-full flex items-center justify-center">
            <div className="text-center">
                <h1 className="bg-fuchsia-600 text-4xl w-fit mx-auto">404 | 页面未找到</h1>
                <p className="mt-2">
                    页面 <InlineCode>/{params['*']}</InlineCode> 似乎不存在。
                </p>
                <Link href="/" className="text-accent hover:underline">返回仪表盘？</Link>
            </div>
        </div>
    );
}
