/* eslint-disable no-param-reassign */
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';

import Prismic from '@prismicio/client';

import {
  AiOutlineCalendar,
  AiOutlineUser,
  AiOutlineClockCircle,
} from 'react-icons/ai';
import { useRouter } from 'next/router';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  if (router.isFallback) {
    return <h2>Carregando...</h2>;
  }

  const totalWords = post.data.content.reduce((total, itemContent) => {
    total += itemContent.heading.split(' ').length;
    total += RichText.asText(itemContent.body).split(' ').length;
    return total;
  }, 0);

  const timeRead = Math.ceil(totalWords / 200);
  const timeFormated = format(
    new Date(post.first_publication_date),
    'dd MMM yyyy',
    {
      locale: ptBR,
    }
  );

  return (
    <>
      <img src={post.data.banner.url} alt="" className={styles.banner} />
      <main className={commonStyles.container}>
        <h1 className={styles.title}>{post.data.title}</h1>
        <div className={styles.infoPost}>
          <span>
            <AiOutlineUser />
            {post.data.author}
          </span>
          <span>
            <AiOutlineCalendar />
            {timeFormated}
          </span>
          <span>
            <AiOutlineClockCircle /> {timeRead} min
          </span>
        </div>

        <div>
          {post.data.content.map(content => {
            return (
              <article key={content.heading} className={styles.content}>
                <h2>{content.heading}</h2>
                <div
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(content.body),
                  }}
                />
              </article>
            );
          })}
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'posts'),
  ]);

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content.map(c => {
        return {
          heading: c.heading,
          body: [...c.body],
        };
      }),
    },
  };

  return {
    props: {
      post,
    },
  };
};
