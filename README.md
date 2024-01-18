# Web3 Blogging System

This project aims to build a decentralized blogging platform using smart contracts on the ICP blockchain. Users can create, update, and delete blog posts, and user interactions such as likes and comments are securely stored on the ICP blockchain. Smart contracts manage user permissions and content moderation.

## Overview

Certainly! Let's delve into more detailed explanations of the provided Motoko code for the decentralized blog application on the Internet Computer blockchain:

### 1. **Data Structures:**

#### `Blog`

- Represents a blog post with the following fields:
  - `id`
   Unique identifier for the blog post (generated using UUID).
  - `title`
   Title of the blog post.
  - `content`
   Content of the blog post.
  - `blogger`
   Principal representing the owner's identity.
  - `likes`
   Number of likes the blog post has received.
  - `tags`
   Vector of strings representing tags associated with the blog.
  - `category`
   Category to which the blog belongs.
  - `comments`
   Vector of strings representing comments on the blog.
  - `updated_at`
   Optional field indicating the timestamp of the last update.
  - `created_date`
   Timestamp indicating when the blog was created.

#### `BlogPayload`

- Represents the payload used for creating or updating a blog post with the following fields:
  - `title`
   Title of the blog post.
  - `content`
   Content of the blog post.
  - `tags`
   Vector of strings representing tags associated with the blog.
  - `category`
   Category to which the blog belongs.

### 2. **StableBTreeMap:**

- `blogStorage` is a persistent key-value store using `StableBTreeMap`.
- It maps `id` (string) to `Blog` records.
- The storage is initialized with specific parameters (0, 44, 512).

### 3. **Functions:**

#### `createBlog`

- Creates a new blog post.
- Validates the payload for required fields.
- Generates a unique `id` using the `uuidv4` library.
- Inserts the new blog post into `blogStorage`.
- Returns a `Result` indicating success or failure.

#### `updateBlog`

- Updates an existing blog post based on its `id`.
- Validates the payload for required fields.
- Checks if the caller is the owner of the blog post.
- Updates the specified fields and updates the `updated_at` timestamp.
- Returns a `Result` indicating success or failure.

#### `getAllBlogs`

- Retrieves all blogs from `blogStorage`.
- Returns a `Result` containing a vector of blogs or an error message.

#### `getBlog`

- Retrieves a blog based on its `id`.
- Returns a `Result` containing the blog or an error message.

#### `searchBlogsByTitleAndContent`

- Searches for blogs containing a specific query string in their title or content.
- Returns a `Result` containing a vector of matching blogs or an error message.

#### `searchBlogsByTags`

- Searches for blogs based on tags.
- Returns a `Result` containing a vector of matching blogs or an error message.

#### `searchBlogsByCategory`

- Searches for blogs based on category.
- Returns a `Result` containing a vector of matching blogs or an error message.

#### `likeBlog`

- Increments the number of likes for a blog.
- Checks if the caller is not the blog owner.
- Returns a `Result` containing the updated blog or an error message.

#### `commentBlog`

- Adds a comment to a blog.
- Returns a `Result` containing the updated blog or an error message.

#### `getBlogComments`

- Retrieves comments for a specific blog.
- Returns a `Result` containing a vector of comments or an error message.

#### `deleteBlog`

- Deletes a blog post.
- Checks if the caller is the owner of the blog post.
- Returns a `Result` containing the deleted blog or an error message.

### 4. **UUID Workaround:**

- The code includes a workaround for generating UUIDs since Internet Computer currently lacks built-in support for UUID generation.
- It uses a simple cryptographic pseudo-random number generator to create a unique byte array that mimics a UUID.

### 5. **Dependencies:**

- The code imports modules from the "azle" library, which likely provides essential functionality for working with the Internet Computer platform.

### 6. **Usage of Internet Computer APIs:**

- The code utilizes Internet Computer APIs such as `ic.caller()`, `ic.time()`, and others to interact with the blockchain.

### 7. **Error Handling:**

- Functions return `Result` types to indicate success or failure, and error messages provide information about the cause of failure.

### 8. **Function Annotations:**

- Functions are annotated with `$update` or `$query` to indicate their nature as update or query functions, respectively.

### 9. **Comments:**

- Inline comments provide explanations for the purpose and logic of certain code blocks.

### 10. **Exported UUID Workaround:**

- The `globalThis.crypto` object is used to provide a workaround for generating UUIDs. This is a common practice in environments where direct access to a cryptographic API is not available.
