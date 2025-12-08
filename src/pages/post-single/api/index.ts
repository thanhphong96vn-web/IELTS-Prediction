import { SEOFragment } from "@/shared/graphql";
import { gql } from "@apollo/client";

export const GET_POST_DATA = gql`
    query GET_POST_DATA($id: ID!) {
        post(id: $id) {
            id
            databaseId
            ${SEOFragment}
            featuredImage {
                node {
                    sourceUrl
                    altText
                }
            }
            categories {
                edges {
                    node {
                        link
                        name
                        id
                    }
                    isPrimary
                }
            }
            date
            title
            content(format: RENDERED)
            postMeta {
                views
                proUserOnly
            }
            rating
            hasAccess
        }
    }
`;

export const GET_RELATED_POSTS = gql`
  query MyQuery($categoryIds: [ID], $notIn: [ID]) {
  posts(where: {categoryIn: $categoryIds, notIn: $notIn}, first: 6) {
    nodes {
      id
      link
      title
      date
      featuredImage {
        node {
          sourceUrl(size: LARGE)
          altText
        }
      }
      categories {
        edges {
          node {
            link
            name
          }
        }
      }
      postMeta {
        views
        proUserOnly
      }
      excerpt
      rating
      hasAccess
    }
  }
}
`;
