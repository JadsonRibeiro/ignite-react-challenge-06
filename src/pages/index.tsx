import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR'
import { FiUser, FiCalendar } from 'react-icons/fi'

import Header from '../components/Header';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Link from 'next/link';
import { useState } from 'react';

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
  const [results, setResults] = useState(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  function formatDate(date: string) {
    return format(new Date(date), "d MMM yyyy", {
      locale: ptBR
    })
  }

  function loadMorePosts() {
    fetch(nextPage)
    .then(res => res.json())
    .then(data => {
      const posts: Post[] = data.results.map((post: Post) => ({
        uid: post.uid,
        first_publication_date: format(new Date(post.first_publication_date), "d MMM yyyy", {
          locale: ptBR
        }),
        data: post.data
      }));

      setResults([
        ...results,
        ...posts
      ]);

      setNextPage(data.next_page);
    })
  }
  
  return (
    <>
      <Header />
      <div className={commonStyles.container}>
        <div className={styles.postsList}>
          {results.map(result => (
            <div key={result.uid} className={styles.postItem}>
              <Link href={`/post/${result.uid}`}><a>
                <h2>{result.data.title}</h2>
              </a></Link>
              <p>{result.data.subtitle}</p>
              <div className={styles.info}>
                <span><FiCalendar /> {formatDate(result.first_publication_date)}</span>
                <span><FiUser /> {result.data.author}</span>
              </div>
            </div>
          ))}
        </div>
        {nextPage && 
          <strong 
            onClick={loadMorePosts}
            className={styles.loadMore}
          >Carregar mais posts</strong>
        }
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], {
    fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
    pageSize: 2
  });

  const posts: Post[] = postsResponse.results.map(post => ({
    uid: post.uid,
    first_publication_date: post.first_publication_date,
    data: post.data
  }))

  return {
    props: {
      postsPagination: {
        results: posts,
        next_page: postsResponse.next_page
      }
    }
  }
};
