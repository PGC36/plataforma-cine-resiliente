import type { Movie } from "@/entities/Movie";
import { MovieCard } from "./MovieCard";

interface MovieGridProps {
  movies: Movie[];
  isFavorite: (id: number) => boolean;
  onToggleFavorite: (id: number) => void;
  onSelectMovie: (movie: Movie) => void;
}

export function MovieGrid({ movies, isFavorite, onToggleFavorite, onSelectMovie }: MovieGridProps) {
  return (
    <main className="container">
      {movies.map((movie, index) => (
        <MovieCard
          key={movie.id}
          movie={movie}
          index={index}
          isFavorite={isFavorite(movie.id)}
          onToggleFavorite={() => onToggleFavorite(movie.id)}
          onSelect={() => onSelectMovie(movie)}
        />
      ))}
    </main>
  );
}
