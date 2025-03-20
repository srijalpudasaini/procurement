<?php

namespace App\Repositories;

use App\Models\Document;

class DocumentRepository extends BaseRepository
{
    /**
     * Create a new class instance.
     */
    public function __construct(Document $documentRepository)
    {
        parent::__construct($documentRepository);
    }
}
