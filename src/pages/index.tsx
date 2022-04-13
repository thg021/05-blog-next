import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import { AiOutlineCalendar, AiOutlineUser } from 'react-icons/ai';
import { format } from 'date-fns';

import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { useState } from 'react';
import { ptBR } from 'date-fns/locale';
import { getPrismicClient } from '../services/prismic';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  // TODO
  const { results, next_page } = postsPagination;

  const postsFormatted: Post[] = results.map(post => {
    return {
      ...post,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        {
          locale: ptBR,
        }
      ),
    };
  });
  const [nextPage, setNextPage] = useState(next_page);
  const [posts, setPosts] = useState<Post[]>(postsFormatted);

  function handleNextPage() {
    if (nextPage === null) return;
    fetch(nextPage)
      .then(response => response.json())
      .then(newPosts => {
        const postsUpdated: Post[] = newPosts.results.map(post => {
          return {
            uid: post.uid,
            first_publication_date: format(
              new Date(post.first_publication_date),
              'dd MMM yyyy',
              {
                locale: ptBR,
              }
            ),
            data: {
              title: RichText.asText(post.data.title),
              subtitle: RichText.asText(post.data.subtitle),
              author: RichText.asText(post.data.author),
            },
          };
        });
        setPosts([...posts, ...postsUpdated]);
        setNextPage(newPosts.next_page);
      });
  }
  return (
    <>
      <Head>
        <title>Post | spacetraveling</title>
      </Head>
      <main className={commonStyles.container}>
        {posts.map(post => {
          return (
            <div className={styles.posts} key={post?.uid}>
              <Link href={`/post/${post.uid}`}>
                <a>
                  <strong>{post.data.title}</strong>
                  <p>{post.data.subtitle}</p>
                  <div className={styles.contentIcons}>
                    <AiOutlineCalendar />
                    <time>{post.first_publication_date}</time>

                    <AiOutlineUser />
                    <span>{post.data.author}</span>
                  </div>
                </a>
              </Link>
            </div>
          );
        })}
        <div className={styles.loadNewPosts}>
          {nextPage && (
            <button type="button" onClick={handleNextPage}>
              Carregar mais posts
            </button>
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const postsResponse = await prismic.query<any>(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 1,
    }
  );

  const { next_page } = postsResponse;
  // console.log(JSON.stringify(postsResponse, null, 2));
  // console.log(postsResponse);
  const posts: Post[] = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title:
          typeof post.data.title === 'string'
            ? post.data.title
            : RichText.asText(post.data.title),
        subtitle:
          typeof post.data.subtitle === 'string'
            ? post.data.subtitle
            : RichText.asText(post.data.subtitle),
        author:
          typeof post.data.author === 'string'
            ? post.data.author
            : RichText.asText(post.data.author),
      },
    };
  });

  const postsPagination: PostPagination = { results: posts, next_page };

  return {
    props: {
      postsPagination,
    },
  };
};
