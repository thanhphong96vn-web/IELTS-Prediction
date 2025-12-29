export const SEOFragment = `
    seo {
        fullHead
        breadcrumbs {
            text
            url
        }
        title
    }
`

export type SEOType = {
    fullHead: string;
    breadcrumbs: {
        text: string;
        url: string;
    }[];
    title: string;
}