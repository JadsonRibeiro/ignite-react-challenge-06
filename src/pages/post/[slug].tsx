import { GetStaticPaths, GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { FiUser, FiCalendar, FiClock } from 'react-icons/fi'
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR'

import { getPrismicClient } from '../../services/prismic';

import { useUtterances } from '../../hooks/useUtterances'
import Header from '../../components/Header';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  uid?: string;
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

  if(router.isFallback) 
    return <span>Carregando...</span>

  // useUtterances(post.uid, '')

  const wordsQuantity = post.data.content.reduce((acc, content) => {
    const wordsQuantity = RichText
      .asText(content.body)
      .concat(content.heading)
      .split(" ")
      .length

    return acc + wordsQuantity;
  }, 0);

  const timeForReading = Math.ceil(wordsQuantity / 200);

  const formatedContent = post.data.content.reduce((text, content) => {
    return text + `<h3>${content.heading}</h3>` + RichText.asHtml(content.body);
  }, "");

  function formatDate(date: string) {
    return format(new Date(date), "d MMM yyyy", {
      locale: ptBR
    })
  }

  return (
    <>
      <Header />
      <img 
        src={post.data.banner.url} 
        alt={post.data.title} 
        className={styles.banner}
      />
      <div className={commonStyles.container}>
        <div className={styles.content}>
          <h1>{post.data.title}</h1>

          <div className={styles.info}>
            <span><FiCalendar /> {formatDate(post.first_publication_date)}</span>
            <span><FiUser /> {post.data.author}</span>
            <span><FiClock /> {timeForReading} min</span>
          </div>
          
          <div className={styles.body}
            dangerouslySetInnerHTML={{ __html: formatedContent }}
          />
        </div>
      </div>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], {
    pageSize: 10
  });

  const paths = posts.results.map(post => ({ params: { slug: post.uid } }))

  return {
    paths,
    fallback: true
  }
};

export const getStaticProps: GetStaticProps<PostProps> = async ({ params }) => {
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(params.slug), {});

  return {
    props: { post: response }
  }
};
