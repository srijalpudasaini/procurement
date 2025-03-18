<?php

namespace App\Repositories;

use App\Interfaces\BaseInterface;
use App\Models\Category;
use Illuminate\Database\Eloquent\Model;

class BaseRepository implements BaseInterface
{
    protected $model;

    public function __construct(Model $model)
    {
        $this->model = $model;
    }
    public function all($paginate = null, $relations = [])
    {
        $query = $this->model->with($relations);

        return $paginate ? $query->paginate($paginate) : $query->get();
    }

    public function find($id, $relations = [])
    {
        return $this->model->with($relations)->findOrFail($id);
    }

    public function store(array $data)
    {
        return $this->model->create($data);
    }

    public function update($id, array $data)
    {
        $category = $this->model->find($id);
        $category->update($data);
        return $category;
    }

    public function delete($id)
    {
        $category = $this->model->find($id);
        $category->delete();
    }
}
