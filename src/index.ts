// Importing necessary modules from "azle"
import {
  $query,
  $update,
  Record,
  StableBTreeMap,
  Vec,
  match,
  Result,
  nat64,
  ic,
  Opt,
  Principal,
} from "azle";
import { v4 as uuidv4 } from "uuid";

// Define the structure for Blog
type Blog = Record<{
  id: string; // Unique identifier for the blog
  title: string; // Title of the blog
  content: string; // Content of the blog
  blogger: Principal; // The author of the blog
  likes: number; // Number of likes the blog has received
  tags: Vec<string>; // Tags associated with the blog
  category: string; // Category of the blog
  comments: Vec<string>; // Comments on the blog
  updated_at: Opt<nat64>; // The timestamp of the last update
  created_date: nat64; // The timestamp of the blog creation
}>;

// Define the structure for BlogPayload
type BlogPayload = Record<{
  title: string; // Title of the blog
  content: string; // Content of the blog
  tags: Vec<string>; // Tags associated with the blog
  category: string; // Category of the blog
}>;

// Create a new StableBTreeMap to store blogs
const blogStorage = new StableBTreeMap<string, Blog>(0, 44, 512);

// Function to create a new blog
$update;
export function createBlog(payload: BlogPayload): Result<Blog, string> {
  // Validate payload
  if (
    !payload.title ||
    !payload.content ||
    !payload.tags ||
    !payload.category
  ) {
    return Result.Err<Blog, string>("Invalid payload input");
  }

  try {
    // Create a new blog
    const blog: Blog = {
      id: uuidv4(), // Generate a unique ID for the blog
      title: payload.title,
      content: payload.content,
      blogger: ic.caller(), // The author of the blog is the caller
      likes: 0, // Initialize likes to 0
      tags: payload.tags,
      category: payload.category,
      comments: [], // Initialize comments as an empty array
      updated_at: Opt.None, // Initialize updated_at as None
      created_date: ic.time(), // The creation date is the current time
    };

    // Insert the new blog into blogStorage
    blogStorage.insert(blog.id, blog);

    return Result.Ok<Blog, string>(blog);
  } catch (error) {
    return Result.Err<Blog, string>(
      "Could not create blog title: " + payload.title
    );
  }
}

// Function to update a blog
$update;
export function updateBlog(
  id: string,
  payload: BlogPayload
): Result<Blog, string> {
  // Validate payload
  if (
    !payload.title ||
    !payload.content ||
    !payload.tags ||
    !payload.category
  ) {
    return Result.Err<Blog, string>("Invalid payload input");
  }

  return match(blogStorage.get(id), {
    Some: (blog) => {
      // Check if the caller is the blog owner
      if (ic.caller() !== blog.blogger) {
        return Result.Err<Blog, string>(
          "Unauthorized, only the blog owner can update the blog"
        );
      }

      // Update the blog
      blog.title = payload.title;
      blog.content = payload.content;
      blog.tags = payload.tags;
      blog.category = payload.category;
      blog.updated_at = Opt.Some(ic.time()); // The update time is the current time

      // Insert the updated blog into blogStorage
      blogStorage.insert(blog.id, blog);

      return Result.Ok<Blog, string>(blog);
    },
    None: () => Result.Err<Blog, string>("Blog not found for id: " + id),
  });
}

// Function to get all blogs
$query;
export function getAllBlogs(): Result<Vec<Blog>, string> {
  const blogs = blogStorage.values();
  // Check for blogs
  if (blogs.length === 0) {
    return Result.Err<Vec<Blog>, string>(
      "No blogs found, please add them first"
    );
  }
  return Result.Ok<Vec<Blog>, string>(blogs);
}

// Function to get a blog by id
$query;
export function getBlog(id: string): Result<Blog, string> {
  const blog = blogStorage.get(id);
  return match(blog, {
    Some: (blog) => {
      return Result.Ok<Blog, string>(blog);
    },
    None: () => {
      return Result.Err<Blog, string>("Blog not found for id: " + id);
    },
  });
}

// Function to search blogs by title and content
$query;
export function searchBlogsByTitleAndContent(
  query: string
): Result<Vec<Blog>, string> {
  const blogs = blogStorage.values();
  const filteredBlogs = blogs.filter(
    (blog) =>
      blog.title.toLowerCase().includes(query.toLowerCase()) ||
      blog.content.toLowerCase().includes(query.toLowerCase())
  );

  // Check for blogs
  if (filteredBlogs.length === 0) {
    return Result.Err<Vec<Blog>, string>(
      "No blogs found, please add them first"
    );
  }
  return Result.Ok<Vec<Blog>, string>(filteredBlogs);
}

// Function to search blogs by tags
$query;
export function searchBlogsByTags(query: string): Result<Vec<Blog>, string> {
  const blogs = blogStorage.values();
  const filteredBlogs = blogs.filter((blog) =>
    blog.tags.includes(query.toLowerCase())
  );

  // Check for blogs
  if (filteredBlogs.length === 0) {
    return Result.Err<Vec<Blog>, string>(
      "No blogs found, please add them first"
    );
  }
  return Result.Ok<Vec<Blog>, string>(filteredBlogs);
}

// Function to search blogs by category
$query;
export function searchBlogsByCategory(
  query: string
): Result<Vec<Blog>, string> {
  const blogs = blogStorage.values();
  const filteredBlogs = blogs.filter((blog) =>
    blog.category.toLowerCase().includes(query.toLowerCase())
  );

  // Check for blogs
  if (filteredBlogs.length === 0) {
    return Result.Err<Vec<Blog>, string>(
      "No blogs found, please add them first"
    );
  }
  return Result.Ok<Vec<Blog>, string>(filteredBlogs);
}

// Function to like a blog
$update;
export function likeBlog(id: string): Result<Blog, string> {
  return match(blogStorage.get(id), {
    Some: (blog) => {
      // Check if the caller is the blog owner
      if (ic.caller() === blog.blogger) {
        return Result.Err<Blog, string>(
          "not allowed, you cannot like your own blog"
        );
      }

      // Update the blog
      blog.likes += 1;

      // Insert the updated blog into blogStorage
      blogStorage.insert(blog.id, blog);

      return Result.Ok<Blog, string>(blog);
    },
    None: () => Result.Err<Blog, string>("Blog not found for id: " + id),
  });
}

// Function to comment on a blog
$update;
export function commentBlog(id: string, comment: string): Result<Blog, string> {
  return match(blogStorage.get(id), {
    Some: (blog) => {
      // Update the blog
      blog.comments.push(comment);

      // Insert the updated blog into blogStorage
      blogStorage.insert(blog.id, blog);

      return Result.Ok<Blog, string>(blog);
    },
    None: () => Result.Err<Blog, string>("Blog not found for id: " + id),
  });
}

// Function to get comments on a blog
$query;
export function getBlogComments(id: string): Result<Vec<string>, string> {
  return match(blogStorage.get(id), {
    Some: (blog) => {
      // Check if blog has comments
      if (blog.comments.length === 0) {
        return Result.Err<Vec<string>, string>(
          "No comments found for blog id: " + id
        );
      }

      return Result.Ok<Vec<string>, string>(blog.comments);
    },
    None: () => Result.Err<Vec<string>, string>("Blog not found for id: " + id),
  });
}

// Function to delete a blog
$update;
export function deleteBlog(id: string): Result<Blog, string> {
  return match(blogStorage.get(id), {
    Some: (blog) => {
      // Check if the caller is the blog owner
      if (ic.caller() !== blog.blogger) {
        return Result.Err<Blog, string>(
          "Unauthorized, only the blog owner can delete the blog"
        );
      }

      // Delete the blog
      blogStorage.remove(id);

      return Result.Ok<Blog, string>(blog);
    },
    None: () => Result.Err<Blog, string>("Blog not found for id: " + id),
  });
}

// UUID workaround
globalThis.crypto = {
  // @ts-ignore
  getRandomValues: () => {
    let array = new Uint8Array(32);

    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }

    return array;
  },
};
