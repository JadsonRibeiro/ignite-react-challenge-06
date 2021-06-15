import { GetStaticPaths, GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { Document } from '@prismicio/client/types/documents';
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
import Link from 'next/link';

const githubRepoName = process.env.NEXT_PUBLIC_GITHUB_REPO_NAME;

interface Post {
  first_publication_date: string | null;
  last_publication_date?: string | null;
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
  previousPost?: Post;
  nextPost?: Post;
  preview: boolean;
}

export default function Post({ post, preview, nextPost, previousPost }: PostProps) {
  const router = useRouter();

  if(router.isFallback) 
    return <span>Carregando...</span>  

  useUtterances(post.uid, githubRepoName);

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

  function formatDate(date: string, pattern: string) {
    return format(new Date(date), pattern, {
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
            <span><FiCalendar /> {formatDate(post.first_publication_date, "d MMM yyyy")}</span>
            <span><FiUser /> {post.data.author}</span>
            <span><FiClock /> {timeForReading} min</span>
          </div>

          {post.last_publication_date && post.last_publication_date !== post.first_publication_date && (
            <span className={styles.updateDate}>
              *editado em {formatDate(post.last_publication_date, "d MMM yyyy, 'às' H:m")}
            </span>
          )}
          
          <div className={styles.body}
            dangerouslySetInnerHTML={{ __html: formatedContent }}
          />
        </div>

        <div className={styles.navigation}>
          <div className={`${styles.item} ${styles.previous}`}>
            {previousPost && (
              <Link href={`/post/${previousPost.uid}`}><a>
                <span>{previousPost.data.title}</span>
                <strong>Post anterior</strong>
              </a></Link>
            )}
          </div>
          <div className={`${styles.item} ${styles.next}`}>
            {nextPost && (
              <Link href={`/post/${nextPost.uid}`}><a>
                <span>{nextPost.data.title}</span>
                <strong>Próximo post</strong>
              </a></Link>
            )}
          </div>
        </div>

        <div id={post.uid} />
        
        {preview && (
          <aside>
            <Link href="/api/exit-preview">
              <a>
                <button className={styles.previewModeButton}>
                  <strong>Sair do modo preview</strong> 
                </button>
              </a>
            </Link>
          </aside>
        )}
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

export const getStaticProps: GetStaticProps<PostProps> = async ({ params, preview = false, previewData }) => {
  const prismic = getPrismicClient();
  const post = await prismic.getByUID('posts', String(params.slug), {
    ref: previewData?.ref ?? null
  });

  let nextPost: Post;
  let previousPost: Post;

  if(post.first_publication_date) {
    nextPost = await prismic.queryFirst([
      Prismic.predicates.at('document.type', 'posts'),
      Prismic.predicates.dateAfter('document.first_publication_date', post.first_publication_date)
    ]);
  
    previousPost = await prismic.queryFirst([
      Prismic.predicates.at('document.type', 'posts'),
      Prismic.predicates.dateBefore('document.first_publication_date' ,post.first_publication_date)
    ]);
  }

  return {
    props: { 
      post,
      nextPost: nextPost ?? null,
      previousPost: previousPost ?? null, 
      preview 
    }
  }
};
